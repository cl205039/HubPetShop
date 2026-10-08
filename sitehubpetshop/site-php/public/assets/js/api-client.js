import { API_BASE_URL } from './api-config.js';

export class ApiError extends Error {
  constructor(mensagem, statusCode = null, codigo = null) {
    super(mensagem);
    this.statusCode = statusCode;
    this.codigo = codigo;
  }
}

const TIMEOUT_MS = 10000;

function montarUrl(caminho, query) {
  const url = new URL(caminho.replace(/^\//, ''), API_BASE_URL);
  if (query) {
    for (const [chave, valor] of Object.entries(query)) {
      if (valor !== undefined && valor !== null && valor !== '') {
        url.searchParams.set(chave, valor);
      }
    }
  }
  return url;
}

async function executar(metodo, caminho, { corpo, query } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let resposta;
  try {
    resposta = await fetch(montarUrl(caminho, query), {
      method: metodo,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    if (e.name === 'AbortError') {
      throw new ApiError('O servidor demorou demais para responder. Tente novamente.');
    }
    throw new ApiError(
      'Não foi possível conectar à API. Verifique o endereço em api-config.js e se o servidor está ligado.',
    );
  } finally {
    clearTimeout(timer);
  }

  if (resposta.status === 204) return null;

  const texto = await resposta.text();
  const dados = texto ? JSON.parse(texto) : null;

  if (resposta.ok) return dados;

  throw new ApiError(
    dados?.mensagem ?? `Erro no servidor (${resposta.status}).`,
    resposta.status,
    dados?.erro ?? null,
  );
}

export const ApiClient = {
  get: (caminho, query) => executar('GET', caminho, { query }),
  post: (caminho, corpo) => executar('POST', caminho, { corpo }),
  put: (caminho, corpo) => executar('PUT', caminho, { corpo }),
  delete: (caminho) => executar('DELETE', caminho),
};
