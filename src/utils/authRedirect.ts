export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized'

export const emitAuthUnauthorized = () => {
  window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT))
}

export const isAuthErrorStatus = (status: number) => status === 401 || status === 403

/**
 * APIレスポンスのステータスコードを確認し、401/403であれば共通イベントを発火する。
 * 各API呼び出し後に任意で呼び出せる軽量ヘルパー。
 */
export const handleAuthErrorStatus = (status: number) => {
  if (isAuthErrorStatus(status)) {
    emitAuthUnauthorized()
  }
}

