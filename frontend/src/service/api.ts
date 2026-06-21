const BACKEND_URL = 'http://localhost:3001/api'; // URL do back
const EXTERNAL_API_URL = 'https://api.adviceslip.com/advice'; // URL da API

// Mapenado resposta da API
export interface AdviceSlipResponse {
  slip: {
    id: number;
    advice: string;
  };
}

export async function fetchRandomAdvice(): Promise<{ id: number; advice: string }> {
  const response = await fetch(`${EXTERNAL_API_URL}?t=${Date.now()}`);
  if (!response.ok) {
    throw new Error('Erro ao buscar conselho na API externa.');
  }
  const data = (await response.json()) as AdviceSlipResponse;
  return {
    id: data.slip.id,
    advice: data.slip.advice,
  };
} // Dispara um get para o servidor da API  e extrai o ID e o advice, que é o próprio conselho

function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('@DailyAdvice:token');
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
} // Vai no localStorage do navegador e vê se tem token guardado lá, se achar ele monta o cabeçalho com o BEARER e o token

export const api = {
  login: async (body: any) => {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res;
  }, 

  signup: async (body: any) => {
    const res = await fetch(`${BACKEND_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res;
  }, // Login e sigup não precisou do getAuthHeader porque o usuário ainda está se autenticando

  getFavorites: async () => {
    const res = await fetch(`${BACKEND_URL}/favorites`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Erro ao buscar favoritos.');
    return res.json();
  },

  addFavorite: async (adviceId: number, advice: string) => {
    const res = await fetch(`${BACKEND_URL}/favorites`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ adviceId, advice }),
    });
    return res;
  },

  updateFavorite: async (id: string, notes: string) => {
    const res = await fetch(`${BACKEND_URL}/favorites/${id}`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify({ notes }),
    });
    return res;
  },

  removeFavorite: async (id: string) => {
    const res = await fetch(`${BACKEND_URL}/favorites/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return res;
  }

  // As funções do CRUD usam o getAuthHeader, então o token vai anexado a elas 
};