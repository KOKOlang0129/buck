import React, { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/MockAuthProvider'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { clearApiKey, loadApiKey, saveApiKey } from '@/lib/settings/apiKeyStore'

const SettingsPage: React.FC = () => {
  const { user } = useAuth()
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const existing = loadApiKey()
    if (existing) setApiKey(existing)
  }, [])

  const handleSave = () => {
    try {
      if (!apiKey.trim()) {
        setError('APIキーを入力してください')
        return
      }
      saveApiKey(apiKey.trim())
      setSaved(true)
      setError('')
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) {
      setError(err.message || '保存に失敗しました')
    }
  }

  const handleClear = () => {
    clearApiKey()
    setApiKey('')
    setSaved(false)
  }

  if (!user) return <div className="p-6 text-red-600 font-semibold">ログインしてください</div>

  const masked = apiKey ? apiKey.replace(/.(?=.{4})/g, '*') : ''

  return (
    <div className="min-h-screen bg-white text-gray-900 p-6 space-y-6">
      <h1 className="text-2xl font-bold">設定</h1>

      {error && (
        <Alert
          variant="error"
          message={error}
          onClose={() => setError('')}
          className="max-w-xl"
        />
      )}

      <div className="max-w-xl space-y-3 border rounded-lg p-4">
        <h2 className="text-lg font-semibold">APIキー登録</h2>
        <Input
          label="APIキー"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
        />
        {apiKey && (
          <p className="text-xs text-gray-500">現在のキー: {masked}</p>
        )}
        <div className="flex gap-2">
          <Button onClick={handleSave}>保存</Button>
          <Button variant="outline" onClick={handleClear}>
            削除
          </Button>
        </div>
        {saved && <p className="text-sm text-green-600">保存しました</p>}
      </div>
    </div>
  )
}

export default SettingsPage

