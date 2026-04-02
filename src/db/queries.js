const { pool } = require('./pool');
const { expandirAbreviacoes, gerarCondicoesBuscaComRanking } = require('../../abreviacoes');
const { gerarVariacoesPrincipioAtivo } = require('../utils/searchUtils');

const STOPWORDS_ATIVO = new Set([
  'de', 'da', 'do', 'das', 'dos', 'e', 'com', 'sem', 'para', 'por',
  'mg', 'ml', 'mcg', 'g', 'ui', 'cp', 'cps', 'caps', 'comp'
]);

function normalizarTextoBusca(valor) {
  return String(valor || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s/+.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extrairTokensBusca(valor) {
  return normalizarTextoBusca(valor)
    .split(' ')
    .filter(token => token.length >= 3 && !STOPWORDS_ATIVO.has(token));
}

function tokensSaoCompativeis(tokenBusca, tokenCandidato) {
  if (!tokenBusca || !tokenCandidato) {
    return false;
  }

  if (tokenBusca === tokenCandidato) {
    return true;
  }

  const menor = Math.min(tokenBusca.length, tokenCandidato.length);
  if (menor < 4) {
    return false;
  }

  return tokenBusca.startsWith(tokenCandidato) || tokenCandidato.startsWith(tokenBusca);
}

function pontuarNomePrincipioAtivo(nomePrincipio, termosBusca) {
  const nomeNormalizado = normalizarTextoBusca(nomePrincipio);
  const tokensNome = extrairTokensBusca(nomePrincipio);
  let score = 0;

  (termosBusca || []).forEach(termo => {
    const termoNormalizado = normalizarTextoBusca(termo);
    const tokensTermo = extrairTokensBusca(termo);

    if (termoNormalizado && nomeNormalizado.includes(termoNormalizado)) {
      score += 200;
    }

    let tokensCompativeis = 0;
    tokensTermo.forEach(token => {
      const combinou = tokensNome.some(tokenNome => tokensSaoCompativeis(token, tokenNome));
      if (combinou) {
        tokensCompativeis += 1;
        score += 25;
      }
    });

    if (tokensTermo.length > 0 && tokensCompativeis === tokensTermo.length) {
      score += 80;
    }
  });

  return score;
}

function adicionarFiltrosDescricao(queryProdutos, params, startIdx, { variacoesForma = [], variacoesConcentracao = [] } = {}) {
  const filtros = [];
  let indiceAtual = startIdx;

  if (Array.isArray(variacoesForma) && variacoesForma.length > 0) {
    const formaPlaceholders = variacoesForma.map((_, idx) => (
      `(p.descricao ILIKE $${indiceAtual + idx} OR em.descricao ILIKE $${indiceAtual + idx})`
    ));

    filtros.push(`(${formaPlaceholders.join(' OR ')})`);
    params.push(...variacoesForma.map(v => `%${v}%`));
    indiceAtual += variacoesForma.length;
  }

  if (Array.isArray(variacoesConcentracao) && variacoesConcentracao.length > 0) {
    const concentracaoPlaceholders = variacoesConcentracao.map((_, idx) => (
      `(p.descricao ILIKE $${indiceAtual + idx} OR em.descricao ILIKE $${indiceAtual + idx})`
    ));

    filtros.push(`(${concentracaoPlaceholders.join(' OR ')})`);
    params.push(...variacoesConcentracao.map(v => `%${v}%`));
    indiceAtual += variacoesConcentracao.length;
  }

  if (filtros.length > 0) {
    queryProdutos += ` AND ${filtros.join(' AND ')}`;
  }

  return queryProdutos;
}

function montarQueryBaseProdutosPorPrincipio(principioPlaceholders) {
  return `
    SELECT
      p.id,
      p.codigo,
      p.descricao,
      p.status,
      p.registroms,
      p.fabricanteid,
      pa.id as principioativo_id,
      pa.nome as principioativo_nome,
      em.id as embalagem_id,
      em.descricao as embalagem_descricao,
      em.codigobarras
    FROM produto p
    INNER JOIN principioativo pa ON p.principioativoid = pa.id
    INNER JOIN embalagem em ON em.produtoid = p.id
    WHERE pa.id IN (${principioPlaceholders})
      AND p.status = 'A'
  `;
}

async function buscarProdutosPorPrincipioIdsComFallback(
  principioIds,
  {
    variacoesForma = [],
    variacoesConcentracao = [],
    limite = 100,
    etapaLog = 'ETAPA 2'
  } = {}
) {
  const principioPlaceholders = principioIds.map((_, idx) => `$${idx + 1}`).join(',');
  const filtrosProgressivos = [];
  const filtrosVistos = new Set();

  function registrarFiltro(nome, forma, concentracao) {
    const formaNormalizada = Array.isArray(forma) ? forma.filter(Boolean) : [];
    const concentracaoNormalizada = Array.isArray(concentracao) ? concentracao.filter(Boolean) : [];
    const chave = JSON.stringify([formaNormalizada, concentracaoNormalizada]);

    if (filtrosVistos.has(chave)) {
      return;
    }

    filtrosVistos.add(chave);
    filtrosProgressivos.push({
      nome,
      variacoesForma: formaNormalizada,
      variacoesConcentracao: concentracaoNormalizada
    });
  }

  if (variacoesForma.length > 0 && variacoesConcentracao.length > 0) {
    registrarFiltro('forma_e_concentracao', variacoesForma, variacoesConcentracao);
  }

  if (variacoesForma.length > 0) {
    registrarFiltro('forma', variacoesForma, []);
  }

  if (variacoesConcentracao.length > 0) {
    registrarFiltro('concentracao', [], variacoesConcentracao);
  }

  registrarFiltro('sem_filtros', [], []);

  for (const filtro of filtrosProgressivos) {
    let queryProdutos = montarQueryBaseProdutosPorPrincipio(principioPlaceholders);
    const params = [...principioIds];

    queryProdutos = adicionarFiltrosDescricao(
      queryProdutos,
      params,
      principioIds.length + 1,
      filtro
    );
    queryProdutos += ` ORDER BY p.descricao LIMIT ${limite}`;

    if (filtro.variacoesForma.length > 0) {
      console.log(`[${etapaLog}] Filtrando por formas: ${filtro.variacoesForma.join(', ')}`);
    }

    if (filtro.variacoesConcentracao.length > 0) {
      console.log(`[${etapaLog}] Filtrando por concentracoes: ${filtro.variacoesConcentracao.join(', ')}`);
    }

    const resultado = await pool.query(queryProdutos, params);
    if (resultado.rows.length > 0) {
      if (filtro.nome !== 'sem_filtros') {
        console.log(
          `[${etapaLog}] Encontrados ${resultado.rows.length} produtos com filtro ${filtro.nome}`
        );
      }

      return {
        rows: resultado.rows,
        filtroAplicado: filtro.nome
      };
    }

    if (filtro.nome !== 'sem_filtros') {
      console.log(`[${etapaLog}] Nenhum produto com filtro ${filtro.nome}, relaxando busca...`);
    }
  }

  return {
    rows: [],
    filtroAplicado: 'sem_resultados'
  };
}

async function buscarPrincipiosAtivosPorTermoFlexivel(termosBusca, limite = 30) {
  const listaTermos = [...new Set(
    (Array.isArray(termosBusca) ? termosBusca : [termosBusca])
      .map(item => String(item || '').trim())
      .filter(Boolean)
  )];

  const tokens = [...new Set(listaTermos.flatMap(extrairTokensBusca))];
  if (tokens.length === 0) {
    return [];
  }

  const nomeNormalizado = `
    lower(
      translate(
        coalesce(nome, ''),
        'ÁÀÃÂÄáàãâäÉÈÊËéèêëÍÌÎÏíìîïÓÒÕÔÖóòõôöÚÙÛÜúùûüÇç',
        'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCc'
      )
    )
  `;

  const condicoes = tokens.map((_, idx) => `${nomeNormalizado} LIKE $${idx + 1}`).join(' OR ');
  const params = tokens.map(token => `%${token}%`);

  const resultado = await pool.query(`
    SELECT DISTINCT id, nome
    FROM principioativo
    WHERE ${condicoes}
    ORDER BY nome
    LIMIT 250
  `, params);

  return resultado.rows
    .map(row => ({
      ...row,
      score_flexivel: pontuarNomePrincipioAtivo(row.nome, listaTermos)
    }))
    .filter(row => row.score_flexivel > 0)
    .sort((a, b) => b.score_flexivel - a.score_flexivel || String(a.nome).localeCompare(String(b.nome)))
    .slice(0, limite);
}

async function buscarPrecosEOfertas(embalagemIds, unidadeNegocioId) {
  console.log(`\n[PREÇOS] Buscando preços e ofertas para ${embalagemIds.length} embalagens...`);

  if (embalagemIds.length === 0) {
    return {};
  }

  try {
    const placeholders = embalagemIds.map((_, idx) => `$${idx + 1}`).join(',');

    const query = `
      SELECT 
        em.id as embalagem_id,
        
        -- Preços da tabela EMBALAGEM (padrão geral)
        em.precoreferencial as preco_referencial_geral,
        em.precovenda as preco_venda_geral,
        em.markup as markup_geral,
        
        -- Preços específicos da UNIDADE DE NEGÓCIO
        peu.precoreferencial as preco_referencial_loja,
        peu.precovenda as preco_venda_loja,
        peu.markup as markup_loja,
        peu.plugpharmaprecocontrolado,
        
        -- Melhor oferta ativa
        mo.precooferta as preco_melhor_oferta,
        mo.descontooferta as desconto_oferta_percentual,
        mo.precounitariosemdesconto as preco_sem_desconto,
        mo.precounitariocomdesconto as preco_com_desconto,
        mo.vigenciainicio as oferta_inicio,
        mo.vigenciatermino as oferta_fim,
        
        -- Caderno de oferta relacionado
        co.nome as nome_caderno_oferta,
        ico.tipooferta,
        ico.leve,
        ico.pague,
        
        -- Preço FINAL (lógica de prioridade)
        CASE
          WHEN mo.precooferta IS NOT NULL 
            AND (mo.vigenciatermino IS NULL OR mo.vigenciatermino >= NOW())
          THEN mo.precooferta
          WHEN peu.precovenda IS NOT NULL 
          THEN peu.precovenda
          ELSE em.precovenda
        END as preco_final_venda,
        
        -- Indicador de oferta ativa
        CASE
          WHEN mo.precooferta IS NOT NULL 
            AND (mo.vigenciatermino IS NULL OR mo.vigenciatermino >= NOW())
          THEN true
          ELSE false
        END as tem_oferta_ativa

      FROM embalagem em
      
      LEFT JOIN precoembalagemunidadenegocio peu 
        ON peu.embalagemid = em.id 
        AND peu.unidadenegocioid = $${embalagemIds.length + 1}
      
      LEFT JOIN melhoroferta mo 
        ON mo.embalagemid = em.id 
        AND mo.unidadenegocioid = $${embalagemIds.length + 1}
        AND (mo.vigenciatermino IS NULL OR mo.vigenciatermino >= NOW())
      
      LEFT JOIN itemcadernooferta ico 
        ON ico.id = (
          SELECT ico2.id 
          FROM itemcadernooferta ico2
          WHERE ico2.embalagemid = em.id 
            AND ico2.cadernoofertaid = mo.cadernoofertaid
          LIMIT 1
        )
      
      LEFT JOIN cadernooferta co 
        ON co.id = mo.cadernoofertaid
      
      WHERE em.id IN (${placeholders})
    `;

    const params = [...embalagemIds, unidadeNegocioId];
    const resultado = await pool.query(query, params);

    const precosMap = {};
    resultado.rows.forEach(row => {
      precosMap[row.embalagem_id] = {
        preco_referencial_geral: parseFloat(row.preco_referencial_geral) || null,
        preco_venda_geral: parseFloat(row.preco_venda_geral) || null,
        markup_geral: parseFloat(row.markup_geral) || null,
        preco_referencial_loja: parseFloat(row.preco_referencial_loja) || null,
        preco_venda_loja: parseFloat(row.preco_venda_loja) || null,
        markup_loja: parseFloat(row.markup_loja) || null,
        plugpharma_preco_controlado: parseFloat(row.plugpharmaprecocontrolado) || null,
        preco_melhor_oferta: parseFloat(row.preco_melhor_oferta) || null,
        desconto_oferta_percentual: parseFloat(row.desconto_oferta_percentual) || null,
        preco_sem_desconto: parseFloat(row.preco_sem_desconto) || null,
        preco_com_desconto: parseFloat(row.preco_com_desconto) || null,
        oferta_inicio: row.oferta_inicio,
        oferta_fim: row.oferta_fim,
        nome_caderno_oferta: row.nome_caderno_oferta,
        tipo_oferta: row.tipooferta,
        leve: row.leve,
        pague: row.pague,
        preco_final_venda: parseFloat(row.preco_final_venda) || null,
        tem_oferta_ativa: row.tem_oferta_ativa || false
      };
    });

    console.log(`[PREÇOS] ✅ Encontrados preços para ${Object.keys(precosMap).length} embalagens`);
    const comOferta = Object.values(precosMap).filter(p => p.tem_oferta_ativa).length;
    if (comOferta > 0) {
      console.log(`[PREÇOS] 🎯 ${comOferta} produto(s) com oferta ativa`);
    }

    return precosMap;
  } catch (error) {
    console.error(`[PREÇOS] ⚠️ Erro:`, error.message);
    return {};
  }
}

async function buscarPorDescricao(termoBusca) {
  console.log(`\n[ETAPA 1] Buscando por DESCRIÇÃO: "${termoBusca}"`);

  try {
    const variacoes = expandirAbreviacoes(termoBusca);

    console.log(`[ETAPA 1] 🔍 Variações geradas: ${variacoes.length}`);
    variacoes.forEach((v, idx) => {
      console.log(`         ${idx + 1}. "${v}"`);
    });

    const { condicoes, parametros, relevanciaSQL, orderBy } = gerarCondicoesBuscaComRanking(variacoes);

    const query = `
      SELECT 
        p.id,
        p.codigo,
        p.descricao,
        p.status,
        p.registroms,
        p.fabricanteid,
        pa.id as principioativo_id,
        pa.nome as principioativo_nome,
        em.id as embalagem_id,
        em.descricao as embalagem_descricao,
        em.codigobarras,
        ${relevanciaSQL} as relevancia_descricao
      FROM produto p
      LEFT JOIN principioativo pa ON p.principioativoid = pa.id
      INNER JOIN embalagem em ON em.produtoid = p.id
      WHERE (${condicoes})
        AND p.status = 'A'
      ORDER BY ${orderBy}
      LIMIT 100
    `;

    const resultado = await pool.query(query, parametros);

    if (resultado.rows.length > 0) {
      console.log(`[ETAPA 1] ✅ Encontrados ${resultado.rows.length} produtos`);
      console.log(`[ETAPA 1] Top 3 por relevância:`);
      resultado.rows.slice(0, 3).forEach((p, idx) => {
        console.log(`         ${idx + 1}. [${p.relevancia_descricao}pts] ${p.descricao.substring(0, 60)}`);
      });

      return {
        encontrado: true,
        produtos: resultado.rows,
        metodo: 'descricao',
        variacoes_usadas: variacoes
      };
    }

    console.log(`[ETAPA 1] ❌ Nenhum produto encontrado`);
    return {
      encontrado: false,
      produtos: [],
      metodo: 'descricao',
      variacoes_usadas: variacoes
    };
  } catch (error) {
    console.error(`[ETAPA 1] ⚠️ Erro:`, error.message);
    throw error;
  }
}

async function buscarPorPrincipioAtivoLegado(principioAtivo, formaFarmaceutica, variacoesForma, variacoesConcentracao = []) {
  console.log(`\n[ETAPA 2] Buscando por PRINCÍPIO ATIVO: "${principioAtivo}"`);

  try {
    const resultadoPrincipios = { rows: [] };
    const principiosEncontrados = (resultadoPrincipios.rows = await buscarPrincipiosAtivosPorTermoFlexivel(principioAtivo));

    if (principiosEncontrados.length === 0) {
      console.log(`[ETAPA 2] ❌ Nenhum princípio ativo encontrado`);
      return {
        encontrado: false,
        produtos: [],
        principiosEncontrados: [],
        metodo: 'principio_ativo'
      };
    }

    console.log(`[ETAPA 2] 📋 Encontrados ${resultadoPrincipios.rows.length} princípios ativos`);
    const principioIds = principiosEncontrados.map(p => p.id);
    const principioPlaceholders = principioIds.map((_, idx) => `$${idx + 1}`).join(',');

    let queryProdutos = `
      SELECT 
        p.id,
        p.codigo,
        p.descricao,
        p.status,
        p.registroms,
        p.fabricanteid,
        pa.id as principioativo_id,
        pa.nome as principioativo_nome,
        em.id as embalagem_id,
        em.descricao as embalagem_descricao,
        em.codigobarras
      FROM produto p
      INNER JOIN principioativo pa ON p.principioativoid = pa.id
      INNER JOIN embalagem em ON em.produtoid = p.id
      WHERE pa.id IN (${principioPlaceholders})
        AND p.status = 'A'
    `;

    let params = [...principioIds];

    if (formaFarmaceutica && variacoesForma.length > 0) {
      const startIdx = principioIds.length + 1;
      const formaPlaceholders = variacoesForma.map((_, idx) => `p.descricao ILIKE $${startIdx + idx}`).join(' OR ');
      queryProdutos += ` AND (${formaPlaceholders})`;
      params.push(...variacoesForma.map(v => `%${v}%`));
      console.log(`[ETAPA 2] 🔍 Filtrando por formas: ${variacoesForma.join(', ')}`);
    }

    queryProdutos += ` ORDER BY p.descricao LIMIT 100`;

    const resultadoProdutos = await pool.query(queryProdutos, params);

    if (resultadoProdutos.rows.length === 0 && formaFarmaceutica) {
      console.log(`[ETAPA 2] 🔄 Tentando sem filtro de forma...`);

      const querySemForma = `
        SELECT 
          p.id,
          p.codigo,
          p.descricao,
          p.status,
          p.registroms,
          p.fabricanteid,
          pa.id as principioativo_id,
          pa.nome as principioativo_nome,
          em.id as embalagem_id,
          em.descricao as embalagem_descricao,
          em.codigobarras
        FROM produto p
        INNER JOIN principioativo pa ON p.principioativoid = pa.id
        INNER JOIN embalagem em ON em.produtoid = p.id
        WHERE pa.id IN (${principioPlaceholders})
          AND p.status = 'A'
        ORDER BY p.descricao
        LIMIT 100
      `;

      const resultadoSemForma = await pool.query(querySemForma, principioIds);

      if (resultadoSemForma.rows.length > 0) {
        console.log(`[ETAPA 2] ✅ Encontrados ${resultadoSemForma.rows.length} produtos (sem forma)`);
        return {
          encontrado: true,
          produtos: resultadoSemForma.rows,
          principiosEncontrados,
          metodo: 'principio_ativo_sem_forma'
        };
      }
    } else if (resultadoProdutos.rows.length > 0) {
      console.log(`[ETAPA 2] ✅ Encontrados ${resultadoProdutos.rows.length} produtos`);
      return {
        encontrado: true,
        produtos: resultadoProdutos.rows,
        principiosEncontrados,
        metodo: 'principio_ativo'
      };
    }

    console.log(`[ETAPA 2] ❌ Nenhum produto encontrado`);
    return {
      encontrado: false,
      produtos: [],
      principiosEncontrados,
      metodo: 'principio_ativo'
    };
  } catch (error) {
    console.error(`[ETAPA 2] ⚠️ Erro:`, error.message);
    throw error;
  }
}

async function buscarPorPrincipioAtivoIdsLegado(principioIds, formaFarmaceutica, variacoesForma, variacoesConcentracao = []) {
  if (!Array.isArray(principioIds) || principioIds.length === 0) {
    return {
      encontrado: false,
      produtos: [],
      metodo: 'principio_ativo_por_ids'
    };
  }

  console.log(`\n[ETAPA 2B] Expandindo por PRINCIPIO ATIVO IDs: ${principioIds.join(', ')}`);

  try {
    const principioPlaceholders = principioIds.map((_, idx) => `$${idx + 1}`).join(',');
    let queryProdutos = `
      SELECT 
        p.id,
        p.codigo,
        p.descricao,
        p.status,
        p.registroms,
        p.fabricanteid,
        pa.id as principioativo_id,
        pa.nome as principioativo_nome,
        em.id as embalagem_id,
        em.descricao as embalagem_descricao,
        em.codigobarras
      FROM produto p
      INNER JOIN principioativo pa ON p.principioativoid = pa.id
      INNER JOIN embalagem em ON em.produtoid = p.id
      WHERE pa.id IN (${principioPlaceholders})
        AND p.status = 'A'
    `;

    let params = [...principioIds];

    if (formaFarmaceutica && variacoesForma.length > 0) {
      const startIdx = principioIds.length + 1;
      const formaPlaceholders = variacoesForma.map((_, idx) => `p.descricao ILIKE $${startIdx + idx}`).join(' OR ');
      queryProdutos += ` AND (${formaPlaceholders})`;
      params.push(...variacoesForma.map(v => `%${v}%`));
      console.log(`[ETAPA 2B] Filtrando por formas: ${variacoesForma.join(', ')}`);
    }

    queryProdutos += ` ORDER BY p.descricao LIMIT 200`;

    const resultadoProdutos = await pool.query(queryProdutos, params);

    if (resultadoProdutos.rows.length === 0 && formaFarmaceutica) {
      const querySemForma = `
        SELECT 
          p.id,
          p.codigo,
          p.descricao,
          p.status,
          p.registroms,
          p.fabricanteid,
          pa.id as principioativo_id,
          pa.nome as principioativo_nome,
          em.id as embalagem_id,
          em.descricao as embalagem_descricao,
          em.codigobarras
        FROM produto p
        INNER JOIN principioativo pa ON p.principioativoid = pa.id
        INNER JOIN embalagem em ON em.produtoid = p.id
        WHERE pa.id IN (${principioPlaceholders})
          AND p.status = 'A'
        ORDER BY p.descricao
        LIMIT 200
      `;

      const resultadoSemForma = await pool.query(querySemForma, principioIds);
      if (resultadoSemForma.rows.length > 0) {
        console.log(`[ETAPA 2B] Encontrados ${resultadoSemForma.rows.length} produtos (sem forma)`);
        return {
          encontrado: true,
          produtos: resultadoSemForma.rows,
          metodo: 'principio_ativo_por_ids_sem_forma'
        };
      }
    } else if (resultadoProdutos.rows.length > 0) {
      console.log(`[ETAPA 2B] Encontrados ${resultadoProdutos.rows.length} produtos`);
      return {
        encontrado: true,
        produtos: resultadoProdutos.rows,
        metodo: 'principio_ativo_por_ids'
      };
    }

    return {
      encontrado: false,
      produtos: [],
      metodo: 'principio_ativo_por_ids'
    };
  } catch (error) {
    console.error(`[ETAPA 2B] Erro:`, error.message);
    throw error;
  }
}

function construirMetodoPrincipioAtivo(baseMetodo, filtroAplicado) {
  if (!filtroAplicado || filtroAplicado === 'sem_resultados') {
    return baseMetodo;
  }

  return filtroAplicado === 'sem_filtros'
    ? `${baseMetodo}_sem_filtros`
    : `${baseMetodo}_${filtroAplicado}`;
}

async function buscarPorPrincipioAtivo(principioAtivo, formaFarmaceutica, variacoesForma, variacoesConcentracao = []) {
  console.log(`\n[ETAPA 2] Buscando por PRINCÍPIO ATIVO: "${principioAtivo}"`);

  try {
    const termosFlexiveis = [...new Set([
      principioAtivo,
      ...gerarVariacoesPrincipioAtivo(principioAtivo)
    ].filter(Boolean))];
    const principiosEncontrados = await buscarPrincipiosAtivosPorTermoFlexivel(termosFlexiveis);

    if (principiosEncontrados.length === 0) {
      console.log(`[ETAPA 2] Nenhum princípio ativo encontrado`);
      return {
        encontrado: false,
        produtos: [],
        principiosEncontrados: [],
        metodo: 'principio_ativo'
      };
    }

    console.log(`[ETAPA 2] Encontrados ${principiosEncontrados.length} princípios ativos`);
    const principioIds = principiosEncontrados.map(principio => principio.id);
    const resultadoProdutos = await buscarProdutosPorPrincipioIdsComFallback(principioIds, {
      variacoesForma,
      variacoesConcentracao,
      limite: 100,
      etapaLog: 'ETAPA 2'
    });

    if (resultadoProdutos.rows.length > 0) {
      console.log(`[ETAPA 2] Encontrados ${resultadoProdutos.rows.length} produtos`);
      return {
        encontrado: true,
        produtos: resultadoProdutos.rows,
        principiosEncontrados,
        metodo: construirMetodoPrincipioAtivo('principio_ativo', resultadoProdutos.filtroAplicado)
      };
    }

    console.log(`[ETAPA 2] Nenhum produto encontrado`);
    return {
      encontrado: false,
      produtos: [],
      principiosEncontrados,
      metodo: 'principio_ativo'
    };
  } catch (error) {
    console.error(`[ETAPA 2] Erro:`, error.message);
    throw error;
  }
}

async function buscarPorPrincipioAtivoIds(principioIds, formaFarmaceutica, variacoesForma, variacoesConcentracao = []) {
  if (!Array.isArray(principioIds) || principioIds.length === 0) {
    return {
      encontrado: false,
      produtos: [],
      metodo: 'principio_ativo_por_ids'
    };
  }

  console.log(`\n[ETAPA 2B] Expandindo por PRINCIPIO ATIVO IDs: ${principioIds.join(', ')}`);

  try {
    const resultadoProdutos = await buscarProdutosPorPrincipioIdsComFallback(principioIds, {
      variacoesForma,
      variacoesConcentracao,
      limite: 200,
      etapaLog: 'ETAPA 2B'
    });

    if (resultadoProdutos.rows.length > 0) {
      console.log(`[ETAPA 2B] Encontrados ${resultadoProdutos.rows.length} produtos`);
      return {
        encontrado: true,
        produtos: resultadoProdutos.rows,
        metodo: construirMetodoPrincipioAtivo('principio_ativo_por_ids', resultadoProdutos.filtroAplicado)
      };
    }

    return {
      encontrado: false,
      produtos: [],
      metodo: 'principio_ativo_por_ids'
    };
  } catch (error) {
    console.error(`[ETAPA 2B] Erro:`, error.message);
    throw error;
  }
}

async function verificarDisponibilidade(produtos, unidadeNegocioId) {
  console.log(`\n[ETAPA 3] Verificando DISPONIBILIDADE de ${produtos.length} produtos...`);

  if (produtos.length === 0) {
    console.log(`[ETAPA 3] ⚠️ Nenhum produto para verificar`);
    return [];
  }

  try {
    const embalagemIds = produtos.map(p => p.embalagem_id);
    const placeholders = embalagemIds.map((_, idx) => `$${idx + 1}`).join(',');

    const resultado = await pool.query(`
      SELECT 
        embalagemid,
        COALESCE(estoque, 0) as estoque_disponivel
      FROM estoque
      WHERE embalagemid IN (${placeholders})
        AND unidadenegocioid = $${embalagemIds.length + 1}
    `, [...embalagemIds, unidadeNegocioId]);

    const estoqueMap = {};
    resultado.rows.forEach(row => {
      estoqueMap[row.embalagemid] = row.estoque_disponivel;
    });

    const precosMap = await buscarPrecosEOfertas(embalagemIds, unidadeNegocioId);

    produtos.forEach(produto => {
      produto.estoque_disponivel = estoqueMap[produto.embalagem_id] || 0;
      produto.tem_estoque = (estoqueMap[produto.embalagem_id] || 0) > 0;

      const precoInfo = precosMap[produto.embalagem_id] || {};
      produto.precos = precoInfo;
    });

    const produtosComEstoque = produtos.filter(p => p.tem_estoque);
    const produtosSemEstoque = produtos.filter(p => !p.tem_estoque);

    console.log(`[ETAPA 3] ✅ ${produtosComEstoque.length} com estoque | ❌ ${produtosSemEstoque.length} sem estoque`);

    return produtosComEstoque;
  } catch (error) {
    console.error(`[ETAPA 3] ⚠️ Erro:`, error.message);
    throw error;
  }
}

module.exports = {
  buscarPrecosEOfertas,
  buscarPorDescricao,
  buscarPorPrincipioAtivo,
  buscarPorPrincipioAtivoIds,
  buscarPrincipiosAtivosPorTermoFlexivel,
  verificarDisponibilidade
};
