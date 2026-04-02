const { formasFarmaceuticas } = require('../../similarity');

const REGEX_CONCENTRACAO = /\b\d+(?:[.,]\d+)?\s?(?:mg|mcg|g|ui)(?:\s*\/\s*(?:\d+(?:[.,]\d+)?\s*)?(?:ml|g|ui))?\b/gi;
const STOPWORDS_LIMPEZA = /\b(em|de|da|do|das|dos|na|no|nas|nos|com|para|por|mg|ml|mcg|g|ui|cp|cps|caps|comp|comprimido|comprimidos)\b/gi;

function escapeRegex(valor) {
  return String(valor || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizarTextoBusca(valor) {
  return String(valor || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s/+.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function limparEspacos(valor) {
  return String(valor || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extrairConcentracoes(termo) {
  const matches = String(termo || '').match(REGEX_CONCENTRACAO) || [];
  const unicos = new Set();

  matches.forEach(match => {
    const normalizado = normalizarTextoBusca(match).replace(/\s+/g, '');
    if (normalizado) {
      unicos.add(normalizado);
    }
  });

  return [...unicos];
}

function gerarVariacoesConcentracao(concentracoes) {
  const variacoes = new Set();

  (concentracoes || []).forEach(concentracao => {
    const compacta = String(concentracao || '').replace(/\s+/g, '');
    if (!compacta) {
      return;
    }

    variacoes.add(compacta);

    const expandida = compacta.replace(/(\d+(?:[.,]\d+)?)(mg|mcg|g|ui)(\/.*)?/i, (_, qtd, unidade, resto = '') => {
      const cauda = resto ? ` ${resto.replace(/\//g, ' / ').replace(/\s+/g, ' ').trim()}` : '';
      return `${qtd} ${unidade}${cauda}`.trim();
    });

    variacoes.add(expandida);
  });

  return [...variacoes].filter(Boolean);
}

function limparTermoBase(termo) {
  return limparEspacos(
    String(termo || '')
      .replace(REGEX_CONCENTRACAO, ' ')
      .replace(STOPWORDS_LIMPEZA, ' ')
  );
}

function extrairFormaFarmaceutica(termo) {
  let principioAtivoBusca = termo;
  let formaFarmaceutica = null;
  let variacoesForma = [];

  for (const [forma, variacoes] of Object.entries(formasFarmaceuticas)) {
    for (const variacao of variacoes) {
      const regex = new RegExp(`\\b${escapeRegex(variacao)}\\b`, 'i');
      if (regex.test(principioAtivoBusca)) {
        formaFarmaceutica = forma;
        variacoesForma = variacoes;
        principioAtivoBusca = principioAtivoBusca.replace(regex, ' ').trim();
        break;
      }
    }

    if (formaFarmaceutica) {
      break;
    }
  }

  principioAtivoBusca = limparTermoBase(principioAtivoBusca);

  return { principioAtivoBusca, formaFarmaceutica, variacoesForma };
}

function extrairContextoBuscaMedicamento(termo) {
  const termoOriginal = limparEspacos(termo);
  const concentracoesBusca = extrairConcentracoes(termoOriginal);
  const variacoesConcentracao = gerarVariacoesConcentracao(concentracoesBusca);
  const { principioAtivoBusca, formaFarmaceutica, variacoesForma } = extrairFormaFarmaceutica(termoOriginal);
  const termoBuscaLimpo = limparTermoBase(principioAtivoBusca || termoOriginal);

  return {
    termoOriginal,
    termoBuscaLimpo,
    principioAtivoBusca: termoBuscaLimpo || principioAtivoBusca || termoOriginal,
    formaFarmaceutica,
    variacoesForma,
    concentracoesBusca,
    variacoesConcentracao
  };
}

function gerarVariacoesPrincipioAtivo(termo) {
  const texto = normalizarTextoBusca(termo);
  if (!texto) {
    return [];
  }

  const tokens = texto
    .split(' ')
    .map(token => token.trim())
    .filter(token => token.length >= 3);

  const variacoes = new Set();
  const completo = tokens.join(' ');
  if (completo) {
    variacoes.add(completo);
  }

  tokens.forEach(token => {
    variacoes.add(token);

    if (token.length >= 5) {
      variacoes.add(token.substring(0, 5));
    }

    if (token.length >= 6) {
      variacoes.add(token.substring(0, 6));
    }
  });

  if (tokens.length >= 2) {
    const abreviado = tokens.map(token => {
      if (token.length <= 4) {
        return token;
      }

      return token.substring(0, token.length >= 7 ? 6 : 4);
    }).join(' ');

    variacoes.add(abreviado);
  }

  return [...variacoes].filter(Boolean);
}

module.exports = {
  extrairFormaFarmaceutica,
  extrairContextoBuscaMedicamento,
  gerarVariacoesConcentracao,
  gerarVariacoesPrincipioAtivo,
  normalizarTextoBusca
};
