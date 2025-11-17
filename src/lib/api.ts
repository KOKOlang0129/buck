/**
 * APIクライアント
 * Firebase FunctionsのバックエンドAPIと通信
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/your-project-id/us-central1/api';

// APIキー（環境変数から取得、またはFirestoreから動的に取得）
const getApiKey = (): string => {
  // TODO: 環境変数またはFirestoreからAPIキーを取得
  return import.meta.env.VITE_API_KEY || '';
};

/**
 * APIリクエストの基本設定
 */
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const apiKey = getApiKey();
  
  const headers = new Headers({
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    ...options.headers as HeadersInit,
  });

  // JWTトークンがある場合は追加
  const token = localStorage.getItem('jwt-token');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response;
};

/**
 * 認証API
 */
export const authAPI = {
  /**
   * ログイン
   */
  login: async (email: string, password: string) => {
    const response = await apiRequest('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    
    // JWTトークンを保存
    if (data.token) {
      localStorage.setItem('jwt-token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  },

  /**
   * トークンリフレッシュ
   */
  refreshToken: async (userId: string, email: string) => {
    const response = await apiRequest('/api/login/refresh', {
      method: 'POST',
      body: JSON.stringify({ userId, email }),
    });
    const data = await response.json();
    
    if (data.token) {
      localStorage.setItem('jwt-token', data.token);
    }
    
    return data;
  },

  /**
   * ログアウト
   */
  logout: () => {
    localStorage.removeItem('jwt-token');
    localStorage.removeItem('user');
  },
};

/**
 * ユーザーAPI
 */
export const userAPI = {
  /**
   * 現在のユーザー情報取得
   */
  getCurrentUser: async () => {
    const response = await apiRequest('/api/user');
    return response.json();
  },

  /**
   * ユーザー情報更新
   */
  updateUser: async (data: { displayName?: string; photoURL?: string }) => {
    const response = await apiRequest('/api/user', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  /**
   * ユーザープロフィール取得
   */
  getProfile: async () => {
    const response = await apiRequest('/api/user/profile');
    return response.json();
  },
};

/**
 * ホワイトリストAPI
 */
export const whitelistAPI = {
  /**
   * ホワイトリスト一覧取得
   */
  getWhitelist: async () => {
    const response = await apiRequest('/api/whitelist');
    return response.json();
  },

  /**
   * ユーザーをホワイトリストに追加
   */
  addToWhitelist: async (data: { targetUserId?: string; email?: string; displayName?: string }) => {
    const response = await apiRequest('/api/whitelist', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  /**
   * ユーザーをホワイトリストから削除
   */
  removeFromWhitelist: async (userId: string) => {
    const response = await apiRequest(`/api/whitelist/${userId}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  /**
   * ホワイトリスト状態確認
   */
  checkWhitelist: async (userId: string) => {
    const response = await apiRequest(`/api/whitelist/check/${userId}`);
    return response.json();
  },
};

/**
 * AIテキスト生成API
 */
export const aiAPI = {
  /**
   * テキスト生成
   */
  generateText: async (prompt: string, provider: 'openai' | 'claude' = 'openai') => {
    const response = await apiRequest('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt, provider }),
    });
    return response.json();
  },
};

/**
 * ヘルスチェック
 */
export const healthCheck = async () => {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
};

