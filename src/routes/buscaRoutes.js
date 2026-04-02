const express = require('express');
const {
  buscarPorDescricao,
  buscarPorPrincipioAtivo,
  buscarPorPrincipioAtivoIds,
  buscarPrincipiosAtivosPorTermoFlexivel,
  verificarDisponibilidade
} = require('../db/queries');
const { enriquecerClassificacaoCanonica } = require('../db/classificacaoQueries');
const { ordenarPorIA } = require('../services/aiService');
const { analisarNecessidadeDeClarificacao } = require('../services/clarificacaoService');
const {
  extrairContextoBuscaMedicamento,
  gerarVariacoesPrincipioAtivo,
  normalizarTextoBusca: normalizarTextoBuscaMedicamento
} = require('../utils/searchUtils');

const router = express.Router();

const UNIDADE_NEGOCIO_ID_PADRAO = parseInt(process.env.UNIDADE_NEGOCIO_ID || '65984');
const REGEX_TERMO_GENERICO = /\b(generico|genericos|gen)\b/gi;
const REGEX_TERMO_REFERENCIA = /\b(referencia|referencias|ref|etico|etica|marca)\b/gi;
const REGEX_TERMO_SIMILAR = /\b(similar|similares|sim)\b/gi;
const REGEX_TERMO_GENERICO_TESTE = /\b(generico|genericos|gen)\b/i;
const REGEX_TERMO_REFERENCIA_TESTE = /\b(referencia|referencias|ref|etico|etica|marca)\b/i;
const REGEX_TERMO_SIMILAR_TESTE = /\b(similar|similares|sim)\b/i;
const STOPWORDS_BUSCA = new Set([
  'de', 'da', 'do', 'das', 'dos', 'e', 'com', 'sem', 'para', 'por', 'na', 'no', 'nas', 'nos',
  'mg', 'ml', 'mcg', 'g', 'ui', 'cp', 'cps', 'caps', 'comp', 'comprimido', 'comprimidos'
]);

function normalizarTextoBusca(valor) {
  return String(valor || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectarIntencaoBusca(termo) {
  const texto = String(termo || '');

  return {
    querGenerico: REGEX_TERMO_GENERICO_TESTE.test(texto),
    querReferencia: REGEX_TERMO_REFERENCIA_TESTE.test(texto),
    querSimilar: REGEX_TERMO_SIMILAR_TESTE.test(texto)
  };
}

function limparTermoBuscaPrincipal(termo) {
  return String(termo || '')
    .replace(REGEX_TERMO_GENERICO, ' ')
    .replace(REGEX_TERMO_REFERENCIA, ' ')
    .replace(REGEX_TERMO_SIMILAR, ' ')
    .replace(/\b(em|de|da|do|das|dos|na|no|nas|nos|com|para|por|mg|ml|mcg|g|ui|cp|cps|caps|comp|comprimido|comprimidos)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extrairTokensBusca(termo) {
  return normalizarTextoBusca(termo)
    .split(' ')
    .filter(token => token.length >= 3 && !STOPWORDS_BUSCA.has(token));
}

function produtoCombinaComBuscaBase(produto, termoBuscaPrincipal) {
  const tokens = extrairTokensBusca(termoBuscaPrincipal);
  if (tokens.length === 0) {
    return false;
  }

  const textoProduto = normalizarTextoBusca(`${produto?.descricao || ''} ${produto?.principioativo_nome || ''}`);
  return tokens.every(token => textoProduto.includes(token));
}

function selecionarProdutosDescricaoConfiaveis(produtosDescricao, termoBuscaPrincipal, limite = 20) {
  const lista = Array.isArray(produtosDescricao) ? produtosDescricao : [];
  const candidatosEstritos = lista.filter(produto => produtoCombinaComBuscaBase(produto, termoBuscaPrincipal));

  if (candidatosEstritos.length > 0) {
    return candidatosEstritos.slice(0, limite);
  }

  return lista.slice(0, Math.min(limite, 10));
}

function resolverPrincipioAtivoDominante(produtosDescricao, termoBuscaPrincipal) {
  const candidatos = selecionarProdutosDescricaoConfiaveis(produtosDescricao, termoBuscaPrincipal)
    .filter(produto => produto?.principioativo_id && produto?.principioativo_nome);

  if (candidatos.length === 0) {
    return null;
  }

  const resumoPorPrincipio = new Map();

  candidatos.forEach(produto => {
    const chave = String(produto.principioativo_id);
    const existente = resumoPorPrincipio.get(chave) || {
      id: produto.principioativo_id,
      nome: produto.principioativo_nome,
      total: 0,
      melhorScore: 0
    };

    existente.total += 1;
    existente.melhorScore = Math.max(existente.melhorScore, Number(produto.relevancia_descricao || 0));
    resumoPorPrincipio.set(chave, existente);
  });

  return [...resumoPorPrincipio.values()]
    .sort((a, b) => b.total - a.total || b.melhorScore - a.melhorScore || a.nome.localeCompare(b.nome))[0] || null;
}

function obterTipoClassificacaoSolicitada(intencaoBusca) {
  if (intencaoBusca?.querGenerico && !intencaoBusca?.querReferencia && !intencaoBusca?.querSimilar) {
    return 'GENERICO';
  }

  if (intencaoBusca?.querReferencia && !intencaoBusca?.querGenerico && !intencaoBusca?.querSimilar) {
    return 'REFERENCIA';
  }

  if (intencaoBusca?.querSimilar && !intencaoBusca?.querGenerico && !intencaoBusca?.querReferencia) {
    return 'SIMILAR';
  }

  return null;
}

function aplicarFiltroPorIntencaoClassificacao(produtos, intencaoBusca) {
  const tipoSolicitado = obterTipoClassificacaoSolicitada(intencaoBusca);
  if (!tipoSolicitado) {
    return {
      produtos,
      aplicado: false,
      tipoSolicitado: null
    };
  }

  const filtrados = produtos.filter(produto => produto?.tipo_classificacao_canonica === tipoSolicitado);
  if (filtrados.length === 0) {
    return {
      produtos,
      aplicado: false,
      tipoSolicitado
    };
  }

  return {
    produtos: filtrados,
    aplicado: true,
    tipoSolicitado
  };
}

function obterChaveProduto(produto) {
  return `${produto?.id ?? 'sem_id'}::${produto?.embalagem_id ?? 'sem_embalagem'}`;
}

function tokensSaoCompativeis(tokenBusca, tokenProduto) {
  if (!tokenBusca || !tokenProduto) {
    return false;
  }

  if (tokenBusca === tokenProduto) {
    return true;
  }

  const menor = Math.min(tokenBusca.length, tokenProduto.length);
  if (menor < 4) {
    return false;
  }

  return tokenBusca.startsWith(tokenProduto) || tokenProduto.startsWith(tokenBusca);
}

function extrairTokensAtivoBusca(termo) {
  return normalizarTextoBuscaMedicamento(termo)
    .split(' ')
    .filter(token => token.length >= 3 && !STOPWORDS_BUSCA.has(token));
}

function pontuarProdutoPorPrincipioAtivo(produto, principioAtivoBase, tipoSolicitado) {
  const tokensBusca = extrairTokensAtivoBusca(principioAtivoBase);
  const textoProduto = `${produto?.principioativo_nome || ''} ${produto?.descricao || ''}`;
  const tokensProduto = extrairTokensAtivoBusca(textoProduto);
  let score = Number(produto?.relevancia_descricao || 0);

  if (tokensBusca.length > 0) {
    const todosCompatíveis = tokensBusca.every(tokenBusca => (
      tokensProduto.some(tokenProduto => tokensSaoCompativeis(tokenBusca, tokenProduto))
    ));

    if (todosCompatíveis) {
      score += 120;
    }

    tokensBusca.forEach(tokenBusca => {
      const combinacoes = tokensProduto.filter(tokenProduto => tokensSaoCompativeis(tokenBusca, tokenProduto)).length;
      score += combinacoes * 12;
    });
  }

  if (!String(produto?.principioativo_nome || '').includes('+')) {
    score += 20;
  } else {
    score -= 10;
  }

  if (tipoSolicitado && produto?.tipo_classificacao_canonica === tipoSolicitado) {
    score += 35;
  }

  return score;
}

function ordenarProdutosPorPrincipioAtivo(produtos, principioAtivoBase, intencaoBusca) {
  const tipoSolicitado = obterTipoClassificacaoSolicitada(intencaoBusca);

  return [...(produtos || [])]
    .map(produto => ({
      ...produto,
      relevancia_descricao: pontuarProdutoPorPrincipioAtivo(produto, principioAtivoBase, tipoSolicitado)
    }))
    .sort((a, b) => {
      const scoreA = Number(a?.relevancia_descricao || 0);
      const scoreB = Number(b?.relevancia_descricao || 0);
      return scoreB - scoreA || String(a?.descricao || '').localeCompare(String(b?.descricao || ''));
    });
}

async function prepararProdutosRecuperados(produtos, unidadeNegocioId, intencaoBusca, principioAtivoBase) {
  let lista = ordenarProdutosPorPrincipioAtivo(produtos, principioAtivoBase, intencaoBusca);

  if (lista.length > 0) {
    lista = await verificarDisponibilidade(lista, unidadeNegocioId);
  }

  if (lista.length > 0) {
    lista = await enriquecerClassificacaoCanonica(lista);
  }

  if (lista.length > 0) {
    const resultadoFiltroClassificacao = aplicarFiltroPorIntencaoClassificacao(lista, intencaoBusca);
    lista = resultadoFiltroClassificacao.produtos;
  }

  return ordenarProdutosPorPrincipioAtivo(lista, principioAtivoBase, intencaoBusca);
}

async function executarFallbackPorPrincipioAtivo({
  termoBusca,
  termoBuscaPrincipal,
  principioAtivoBusca,
  principioAtivoResolvido,
  produtosAtuais,
  formaFarmaceutica,
  variacoesForma,
  variacoesConcentracao,
  unidadeNegocioId,
  intencaoBusca
}) {
  const termosBase = [
    principioAtivoResolvido,
    principioAtivoBusca,
    termoBuscaPrincipal,
    termoBusca
  ].filter(Boolean);
  const variacoes = [...new Set(termosBase.flatMap(gerarVariacoesPrincipioAtivo))];
  const principiosAtivos = await buscarPrincipiosAtivosPorTermoFlexivel([...termosBase, ...variacoes], 40);
  const idsAtuais = (produtosAtuais || [])
    .map(produto => produto?.principioativo_id)
    .filter(id => id !== null && id !== undefined);
  const principioIds = [...new Set([...idsAtuais, ...principiosAtivos.map(item => item.id)])];

  if (principioIds.length === 0) {
    return {
      aplicado: false,
      produtos: [],
      resultadoIA: null,
      principiosAtivos,
      principioIds
    };
  }

  const resultadoBuscaIds = await buscarPorPrincipioAtivoIds(
    principioIds.slice(0, 40),
    formaFarmaceutica,
    variacoesForma,
    variacoesConcentracao
  );

  if (!resultadoBuscaIds.encontrado) {
    return {
      aplicado: false,
      produtos: [],
      resultadoIA: null,
      principiosAtivos,
      principioIds
    };
  }

  const produtosPreparados = await prepararProdutosRecuperados(
    resultadoBuscaIds.produtos.map(produto => ({ ...produto, origem: 'fallback_principio_ativo' })),
    unidadeNegocioId,
    intencaoBusca,
    principioAtivoResolvido || principioAtivoBusca || termoBuscaPrincipal
  );

  const resultadoIA = await ordenarPorIA(produtosPreparados, {
    termoBusca,
    termoBuscaPrincipal,
    principioAtivoBusca: principioAtivoResolvido || principioAtivoBusca || termoBuscaPrincipal,
    formaFarmaceutica,
    intencaoClassificacao: intencaoBusca,
    permitirCompostosComoAlternativa: true,
    modoFallbackPrincipioAtivo: true
  });

  return {
    aplicado: true,
    produtos: resultadoIA.produtos,
    resultadoIA,
    principiosAtivos,
    principioIds,
    metodo: resultadoBuscaIds.metodo
  };
}

function descreverProdutoParaLog(produto) {
  if (!produto) {
    return 'produto indefinido';
  }

  const partes = [
    `id=${produto.id ?? 'n/a'}`,
    `emb=${produto.embalagem_id ?? 'n/a'}`,
    `origem=${produto.origem ?? 'n/a'}`,
    `sql=${produto.relevancia_descricao ?? 0}`,
    `ia=${produto.relevancia_score ?? 'n/a'}`
  ];

  if (produto.principioativo_nome) {
    partes.push(`pa=${produto.principioativo_nome}`);
  }

  return `${partes.join(' | ')} | ${String(produto.descricao || '').substring(0, 90)}`;
}

function logResumoProdutos(etapa, produtos, limite = 5) {
  const lista = Array.isArray(produtos) ? produtos : [];
  console.log(`[TRACE] ${etapa} | total=${lista.length}`);

  if (lista.length === 0) {
    return;
  }

  lista.slice(0, limite).forEach((produto, idx) => {
    console.log(`         ${idx + 1}. ${descreverProdutoParaLog(produto)}`);
  });

  if (lista.length > limite) {
    console.log(`         ... +${lista.length - limite} produto(s)`);
  }
}

function logDistribuicao(etapa, produtos, campo) {
  const lista = Array.isArray(produtos) ? produtos : [];
  const contagem = new Map();

  lista.forEach(produto => {
    const chave = produto?.[campo] || 'SEM_VALOR';
    contagem.set(chave, (contagem.get(chave) || 0) + 1);
  });

  const resumo = [...contagem.entries()]
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
    .map(([chave, total]) => `${chave}:${total}`)
    .join(' | ');

  console.log(`[TRACE] ${etapa} | ${campo} => ${resumo || 'vazio'}`);
}

router.post('/api/buscar-medicamentos', async (req, res) => {
  try {
    const { query, unidade_negocio_id } = req.body;

    if (!query || query.trim() === '') {
      return res.status(400).json({ erro: 'Query vazia' });
    }

    const unidadeNegocioId = unidade_negocio_id || UNIDADE_NEGOCIO_ID_PADRAO;
    const termoBusca = query.trim().toLowerCase();

    console.log(`\n========================================`);
    console.log(`[BUSCA] Termo: "${termoBusca}"`);
    console.log(`[BUSCA] Unidade Negócio ID: ${unidadeNegocioId}`);
    console.log(`========================================`);

    const intencaoBusca = detectarIntencaoBusca(termoBusca);
    const {
      principioAtivoBusca: principioAtivoExtraido,
      termoBuscaLimpo,
      formaFarmaceutica,
      variacoesForma,
      concentracoesBusca,
      variacoesConcentracao
    } = extrairContextoBuscaMedicamento(termoBusca);
    const termoBuscaPrincipal = limparTermoBuscaPrincipal(termoBuscaLimpo)
      || limparTermoBuscaPrincipal(principioAtivoExtraido)
      || limparTermoBuscaPrincipal(termoBusca)
      || termoBuscaLimpo
      || principioAtivoExtraido
      || termoBusca;
    let principioAtivoBusca = termoBuscaPrincipal;
    let principioAtivoResolvido = null;

    console.log(`[INFO] Termo principal de busca: "${termoBuscaPrincipal}"`);
    console.log(
      `[INFO] Intencao: generico=${intencaoBusca.querGenerico ? 'sim' : 'nao'} | ` +
      `referencia=${intencaoBusca.querReferencia ? 'sim' : 'nao'} | similar=${intencaoBusca.querSimilar ? 'sim' : 'nao'}`
    );

    console.log(`[INFO] Princípio ativo extraído: "${principioAtivoBusca}"`);
    console.log(`[INFO] Forma farmacêutica: "${formaFarmaceutica || 'nenhuma'}"`);

    if (concentracoesBusca.length > 0) {
      console.log(`[INFO] Concentracoes: ${concentracoesBusca.join(' | ')}`);
    }

    let produtosPrincipioAtivo = [];
    let produtosDescricao = [];
    let principiosEncontrados = [];
    let metodosUtilizados = [];

    let [resultadoPrincipioAtivo, resultadoDescricao] = await Promise.all([
      buscarPorPrincipioAtivo(principioAtivoBusca, formaFarmaceutica, variacoesForma, variacoesConcentracao),
      buscarPorDescricao(termoBuscaPrincipal)
    ]);

    if ((!resultadoDescricao.produtos || resultadoDescricao.produtos.length === 0) && termoBuscaPrincipal !== termoBusca) {
      console.log(`[TRACE] Fallback de descricao com termo original: "${termoBusca}"`);
      resultadoDescricao = await buscarPorDescricao(termoBusca);
    }

    if (resultadoPrincipioAtivo.encontrado) {
      produtosPrincipioAtivo = resultadoPrincipioAtivo.produtos;
      principiosEncontrados = resultadoPrincipioAtivo.principiosEncontrados || [];
      metodosUtilizados.push(resultadoPrincipioAtivo.metodo);
      console.log(`[TRACE] Principios ativos encontrados: ${principiosEncontrados.map(p => p.nome).slice(0, 10).join(' | ') || 'nenhum'}`);
      logResumoProdutos('Resultado bruto por principio ativo', produtosPrincipioAtivo);
    }

    if (resultadoDescricao.produtos && resultadoDescricao.produtos.length > 0) {
      produtosDescricao = resultadoDescricao.produtos;
      metodosUtilizados.push(resultadoDescricao.metodo);
      logResumoProdutos('Resultado bruto por descricao', produtosDescricao);
    }

    const produtosDescricaoConfiaveis = selecionarProdutosDescricaoConfiaveis(produtosDescricao, termoBuscaPrincipal);
    const produtosDescricaoBase = produtosDescricaoConfiaveis.length > 0
      ? produtosDescricaoConfiaveis
      : produtosDescricao;
    if (produtosDescricaoConfiaveis.length > 0) {
      logResumoProdutos('Resultado confiavel por descricao', produtosDescricaoConfiaveis);
    }

    const principioResolvido = resolverPrincipioAtivoDominante(produtosDescricaoConfiaveis, termoBuscaPrincipal);
    if (principioResolvido) {
      principioAtivoResolvido = principioResolvido.nome;
      principioAtivoBusca = principioAtivoResolvido;
      console.log(
        `[TRACE] Principio ativo resolvido via descricao: "${principioAtivoResolvido}" ` +
        `| id=${principioResolvido.id} | ocorrencias=${principioResolvido.total}`
      );
    }

    if (
      principioAtivoResolvido &&
      normalizarTextoBusca(principioAtivoResolvido) !== normalizarTextoBusca(principioAtivoExtraido) &&
      !resultadoPrincipioAtivo.encontrado
    ) {
      const resultadoPrincipioAtivoResolvido = await buscarPorPrincipioAtivo(
        principioAtivoResolvido,
        formaFarmaceutica,
        variacoesForma,
        variacoesConcentracao
      );

      if (resultadoPrincipioAtivoResolvido.encontrado) {
        produtosPrincipioAtivo = [...produtosPrincipioAtivo, ...resultadoPrincipioAtivoResolvido.produtos];
        principiosEncontrados = resultadoPrincipioAtivoResolvido.principiosEncontrados || [];
        metodosUtilizados.push('principio_ativo_resolvido_descricao');
        logResumoProdutos(
          'Resultado por principio ativo resolvido via descricao',
          resultadoPrincipioAtivoResolvido.produtos
        );
      }
    }

    const principioAtivoIdsDaDescricao = [...new Set(
      produtosDescricaoBase
        .map(p => p.principioativo_id)
        .filter(id => id !== null && id !== undefined)
    )];

    if (principioAtivoIdsDaDescricao.length > 0) {
      console.log(`[TRACE] IDs de principio ativo herdados da descricao: ${principioAtivoIdsDaDescricao.slice(0, 10).join(', ')}`);
      const resultadoExpandidoPorPrincipio = await buscarPorPrincipioAtivoIds(
        principioAtivoIdsDaDescricao.slice(0, 10),
        formaFarmaceutica,
        variacoesForma,
        variacoesConcentracao
      );

      if (resultadoExpandidoPorPrincipio.encontrado) {
        produtosPrincipioAtivo = [...produtosPrincipioAtivo, ...resultadoExpandidoPorPrincipio.produtos];
        metodosUtilizados.push(resultadoExpandidoPorPrincipio.metodo);
        logResumoProdutos('Resultado expandido por principio ativo vindo da descricao', resultadoExpandidoPorPrincipio.produtos);
      }
    }

    const produtosMap = new Map();

    produtosPrincipioAtivo.forEach(p => {
      produtosMap.set(p.id, { ...p, origem: 'principio_ativo' });
    });

    produtosDescricaoBase.forEach(p => {
      if (!produtosMap.has(p.id)) {
        produtosMap.set(p.id, { ...p, origem: 'descricao' });
      } else {
        const produto = produtosMap.get(p.id);
        produto.origem = 'ambos';
        produto.relevancia_descricao = p.relevancia_descricao;
        produtosMap.set(p.id, produto);
      }
    });

    let produtos = Array.from(produtosMap.values());

    produtos.sort((a, b) => {
      const scoreA = a.relevancia_descricao || 0;
      const scoreB = b.relevancia_descricao || 0;
      return scoreB - scoreA;
    });

    console.log(`[INFO] Total de produtos únicos combinados: ${produtos.length}`);
    logDistribuicao('Distribuicao apos merge', produtos, 'origem');
    logResumoProdutos('Produtos combinados apos merge e ordenacao SQL', produtos);

    if (produtos.length > 0) {
      produtos = await verificarDisponibilidade(produtos, unidadeNegocioId);
      console.log(`[INFO] Após verificação de estoque: ${produtos.length} produtos`);
      logResumoProdutos('Produtos apos filtro de estoque', produtos);
    }

    if (produtos.length > 0) {
      produtos = await enriquecerClassificacaoCanonica(produtos);
      logDistribuicao('Distribuicao apos classificacao canonica', produtos, 'tipo_classificacao_canonica');
      logResumoProdutos('Produtos apos enriquecimento de classificacao', produtos);
    }

    if (produtos.length > 0) {
      const resultadoFiltroClassificacao = aplicarFiltroPorIntencaoClassificacao(produtos, intencaoBusca);

      if (resultadoFiltroClassificacao.aplicado) {
        produtos = resultadoFiltroClassificacao.produtos;
        metodosUtilizados.push(`filtro_classificacao_${String(resultadoFiltroClassificacao.tipoSolicitado || '').toLowerCase()}`);
        console.log(
          `[TRACE] Filtro por intencao de classificacao aplicado: ${resultadoFiltroClassificacao.tipoSolicitado}`
        );
        logResumoProdutos('Produtos apos filtro por intencao de classificacao', produtos);
      } else if (resultadoFiltroClassificacao.tipoSolicitado) {
        console.log(
          `[TRACE] Nenhum produto da classificacao solicitada (${resultadoFiltroClassificacao.tipoSolicitado}) ` +
          `para aplicar filtro estrito`
        );
      }
    }

    let ordenadoPorIA = false;
    let filtradoPorIA = false;
    let avaliadoPorIA = false;
    let estatisticasIA = { aprovados: 0, rejeitados: 0, analisados: 0 };
    console.log(`[INFO] Iniciando IA para marcar candidatos`);
    if (produtos.length > 0 ) {
      logResumoProdutos('Candidatos enviados para etapa de IA', produtos);
      const resultadoIA = await ordenarPorIA(produtos, {
        termoBusca,
        termoBuscaPrincipal,
        principioAtivoBusca,
        formaFarmaceutica,
        intencaoClassificacao: intencaoBusca
      });
      produtos = resultadoIA.produtos;
      ordenadoPorIA = resultadoIA.ordenado;
      filtradoPorIA = resultadoIA.filtrado;
      avaliadoPorIA = resultadoIA.avaliado === true;
      estatisticasIA = resultadoIA.estatisticasIA || estatisticasIA;
      logResumoProdutos('Produtos apos marcacao da IA', produtos);
    }

    if (produtos.length > 0 && avaliadoPorIA && estatisticasIA.aprovados === 0) {
      console.log('[INFO] IA zerou relacionados - iniciando fallback por principio ativo + IDs');
      const resultadoFallback = await executarFallbackPorPrincipioAtivo({
        termoBusca,
        termoBuscaPrincipal,
        principioAtivoBusca,
        principioAtivoResolvido,
        produtosAtuais: produtos,
        formaFarmaceutica,
        variacoesForma,
        variacoesConcentracao,
        unidadeNegocioId,
        intencaoBusca
      });

      if (resultadoFallback.aplicado) {
        const aprovadosFallback = resultadoFallback.resultadoIA?.estatisticasIA?.aprovados || 0;
        console.log(
          `[INFO] Fallback por principio ativo retornou ${resultadoFallback.produtos.length} produto(s) ` +
          `| relacionados=${aprovadosFallback}`
        );

        if (aprovadosFallback > 0) {
          produtos = resultadoFallback.produtos;
          ordenadoPorIA = resultadoFallback.resultadoIA.ordenado;
          filtradoPorIA = resultadoFallback.resultadoIA.filtrado;
          avaliadoPorIA = resultadoFallback.resultadoIA.avaliado === true;
          estatisticasIA = resultadoFallback.resultadoIA.estatisticasIA || estatisticasIA;
          metodosUtilizados.push('fallback_principio_ativo_ids');
          if (resultadoFallback.metodo) {
            metodosUtilizados.push(resultadoFallback.metodo);
          }
          logResumoProdutos('Produtos apos fallback por principio ativo', produtos);
        } else {
          console.log('[INFO] Fallback executado, mas sem ganho de relacionados aprovados');
        }
      }
    }

    const produtosParaClarificacao = produtos.filter(produto => produto.relacionado_busca !== false);
    console.log(
      `[CLARIFICACAO] Base considerada para clarificacao: ${produtosParaClarificacao.length} produto(s)`
    );
    const clarificacao = analisarNecessidadeDeClarificacao({
      query: termoBusca,
      produtos: produtosParaClarificacao
    });

    console.log(
      `[CLARIFICACAO] ${clarificacao.precisa_clarificar ? 'Necessaria' : 'Nao'} ` +
      `| Produtos analisados: ${clarificacao.total_produtos_analisados || 0}`
    );
    if (clarificacao.precisa_clarificar) {
      console.log(`[CLARIFICACAO] Pergunta: ${clarificacao.pergunta}`);
      console.log(`[CLARIFICACAO] Opcoes: ${(clarificacao.opcoes || []).join(' | ')}`);
    }

    const metodoBusca = metodosUtilizados.length > 0
      ? metodosUtilizados.join(' + ')
      : 'nenhum método encontrou resultados';
    const classificacoesDisponiveis = [...new Set(produtos.map(p => p.tipo_classificacao_canonica).filter(Boolean))];
    const classificacoesNaoMapeadas = [...new Set(
      produtos
        .filter(p => p.tipo_classificacao_canonica === 'DESCONHECIDO')
        .map(p => `${p.classificacao_id_origem || 'sem_id'}:${p.classificacao_nome_origem || 'sem_nome'}`)
    )];

    console.log(`\n========================================`);
    console.log(`[RESULTADO] ${produtos.length} produto(s) encontrado(s)`);
    console.log(`[RESULTADO] Métodos: ${metodoBusca}`);
    console.log(`[RESULTADO] Ordenado por IA: ${ordenadoPorIA ? 'Sim' : 'Não'}`);
    console.log(`[RESULTADO] Filtrado por IA: ${filtradoPorIA ? 'Sim' : 'Não'}`);
    console.log(`[RESULTADO] Avaliado por IA: ${avaliadoPorIA ? 'Sim' : 'Não'}`);
    console.log(
      `[RESULTADO] IA relacionados=${estatisticasIA.aprovados} | nao_relacionados=${estatisticasIA.rejeitados} | analisados=${estatisticasIA.analisados}`
    );
    logDistribuicao('Distribuicao final por origem', produtos, 'origem');
    logDistribuicao('Distribuicao final por classificacao', produtos, 'tipo_classificacao_canonica');
    logResumoProdutos('Resultado final retornado', produtos);
    console.log(`========================================\n`);

    return res.status(200).json({
      busca: {
        termo_original: termoBusca,
        principio_ativo_extraido: principioAtivoResolvido || (resultadoPrincipioAtivo.encontrado ? principioAtivoBusca : null),
        forma_farmaceutica: formaFarmaceutica
      },
      metadados: {
        metodo_busca: metodoBusca,
        ordenado_por_ia: ordenadoPorIA,
        filtrado_por_ia: filtradoPorIA,
        avaliado_por_ia: avaliadoPorIA,
        produtos_relacionados_busca_ia: estatisticasIA.aprovados,
        produtos_nao_relacionados_busca_ia: estatisticasIA.rejeitados,
        produtos_analisados_ia: estatisticasIA.analisados,
        busca_ambigua: clarificacao.precisa_clarificar,
        total_produtos: produtos.length,
        unidade_negocio_id: unidadeNegocioId,
        classificacoes_disponiveis: classificacoesDisponiveis,
        classificacoes_nao_mapeadas: classificacoesNaoMapeadas
      },
      clarificacao,
      produtos: produtos.map(p => ({
        id: p.id,
        codigo: p.codigo,
        codigo_barras: p.codigobarras,
        descricao: p.descricao,
        principio_ativo: p.principioativo_nome || null,
        tipo_classificacao: p.tipo_classificacao_canonica || null,
        classificacao_id_origem: p.classificacao_id_origem || null,
        classificacao_nome_origem: p.classificacao_nome_origem || null,
        embalagem_id: p.embalagem_id,
        estoque_disponivel: p.estoque_disponivel || 0,
        relevancia_score: p.relevancia_score ?? p.relevancia_descricao ?? null,
        relacionado_busca: p.relacionado_busca ?? null,
        origem_busca: p.origem,
        precos: {
          preco_venda: p.precos?.preco_final_venda || null,
          tem_oferta_ativa: p.precos?.tem_oferta_ativa || false,
          preco_sem_desconto: p.precos?.preco_sem_desconto || null,
          preco_com_desconto: p.precos?.preco_com_desconto || null,
          desconto_percentual: p.precos?.desconto_oferta_percentual || null,
          nome_caderno_oferta: p.precos?.nome_caderno_oferta || null,
          tipo_oferta: p.precos?.tipo_oferta || null,
          leve: p.precos?.leve || null,
          pague: p.precos?.pague || null,
          oferta_inicio: p.precos?.oferta_inicio || null,
          oferta_fim: p.precos?.oferta_fim || null,
          preco_referencial_geral: p.precos?.preco_referencial_geral || null,
          preco_venda_geral: p.precos?.preco_venda_geral || null,
          preco_referencial_loja: p.precos?.preco_referencial_loja || null,
          preco_venda_loja: p.precos?.preco_venda_loja || null,
          markup_geral: p.precos?.markup_geral || null,
          markup_loja: p.precos?.markup_loja || null,
          plugpharma_preco_controlado: p.precos?.plugpharma_preco_controlado || null
        }
      }))
    });
  } catch (error) {
    console.error('❌ Erro ao buscar medicamento:', error);
    return res.status(500).json({
      erro: 'Erro ao processar busca',
      detalhes: error.message
    });
  }
});

router.get('/', (req, res) => {
  res.json({ mensagem: 'API de busca de medicamentos está rodando!' });
});

module.exports = { router };
