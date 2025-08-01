// Arquivo: src/services/api.js (NOVO)

// O endereço base da sua API. Note que já inclui o /api que corrigimos no backend.
const API_BASE_URL = 'http://127.0.0.1:5000/api';

// As chaves que usamos para guardar dados no localStorage do navegador.
const AUTH_TOKEN_KEY = 'restaurantAuthToken';
const USER_DATA_KEY = 'restaurantUser';

/**
 * Processa a resposta de uma chamada fetch.
 * Lida com erros comuns como 401 (Não Autorizado) e outros erros HTTP,
 * e converte a resposta para JSON se for bem-sucedida.
 */
export const processResponse = async (response) => {
    // Se a sessão expirou (erro 401), limpa os dados do utilizador e redireciona para o login.
    if (response.status === 401) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);
        // Descomente a linha abaixo se quiser que o redirecionamento seja automático.
        // window.location.href = '/login'; 
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }

    // Se a resposta não for 'ok' (ex: erro 404, 500), tenta extrair uma mensagem de erro.
    if (!response.ok) {
        try {
            const errorData = await response.json();
            const errorMessage = errorData.message || errorData.error || `Erro ${response.status}`;
            throw new Error(errorMessage);
        } catch (jsonError) {
            // Caso a resposta de erro não seja um JSON válido.
            throw new Error(`Erro HTTP ${response.status}`);
        }
    }

    // Se a resposta for 204 (No Content), não há corpo para processar.
    if (response.status === 204) {
        return null;
    }

    // Se tudo correu bem, retorna o corpo da resposta em formato JSON.
    return response.json();
};

/**
 * Cria o cabeçalho de Autorização para ser usado em chamadas a rotas protegidas.
 */
export const createAuthHeaders = () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
        // Retorna um objeto de cabeçalho vazio se não houver token.
        // A função que chama é responsável por decidir o que fazer se o token for necessário.
        return {};
    }
    // Retorna o cabeçalho no formato 'Bearer Token'.
    return { 'Authorization': `Bearer ${token}` };
};

// Exportamos as constantes para que possam ser usadas em outros arquivos, se necessário.
export { API_BASE_URL, AUTH_TOKEN_KEY, USER_DATA_KEY };