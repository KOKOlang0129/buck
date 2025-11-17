import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/components/providers/MockAuthProvider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await signIn(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'ログインに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center">
      <div className="w-full max-w-md px-4 sm:px-6 lg:px-8">
        <div className="border border-gray-300 rounded-lg bg-white px-6 py-10 sm:px-12 sm:py-14 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-800 mb-12 text-center">あるかなライター</h1>

          <div className="w-full">
            {error && (
              <Alert
                variant="error"
                message={error}
                onClose={() => setError('')}
                className="mb-6"
              />
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <Input
                label="メールアドレス"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pxr@example.com"
                required
              />

              <Input
                label="パスワード"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力"
                required
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    ログイン中...
                  </>
                ) : (
                  'ログイン'
                )}
              </Button>
            </form>

            <div className="mt-4 text-sm text-center">
              <a href="#" className="text-gray-700 underline hover:text-gray-900">
                パスワード忘れた方はこちら
              </a>
            </div>
          </div>

          <div className="mt-24 sm:mt-28 flex flex-col items-center space-y-2 text-sm text-gray-600">
            <Link to="#" className="underline hover:text-gray-800">
              アルカナライター テスター希望はこちら
            </Link>
            <Link to="#" className="underline hover:text-gray-800">
              利用規約
            </Link>
            <p className="text-xs uppercase tracking-wide">PxR LLC.</p>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="#"
              className="text-xs text-gray-500 underline hover:text-gray-700"
            >
              フォームへリンク
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
