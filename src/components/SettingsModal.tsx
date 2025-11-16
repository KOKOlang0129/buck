/**
 * 設定モーダルコンポーネント
 * APIキー入力と各種設定
 */

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X } from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (settings: SettingsData) => void
}

export interface SettingsData {
  apiKey: string
  useShortcutKeys: boolean
  dontSaveAIHistory: boolean
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [apiKey, setApiKey] = useState('')
  const [useShortcutKeys, setUseShortcutKeys] = useState(false)
  const [dontSaveAIHistory, setDontSaveAIHistory] = useState(false)

  // ローカルストレージから設定を読み込む
  useEffect(() => {
    if (isOpen) {
      const savedApiKey = localStorage.getItem('apiKey') || ''
      const savedUseShortcutKeys = localStorage.getItem('useShortcutKeys') === 'true'
      const savedDontSaveAIHistory = localStorage.getItem('dontSaveAIHistory') === 'true'
      
      setApiKey(savedApiKey)
      setUseShortcutKeys(savedUseShortcutKeys)
      setDontSaveAIHistory(savedDontSaveAIHistory)
    }
  }, [isOpen])

  const handleSave = () => {
    const settings: SettingsData = {
      apiKey,
      useShortcutKeys,
      dontSaveAIHistory
    }
    
    // ローカルストレージに保存
    localStorage.setItem('apiKey', apiKey)
    localStorage.setItem('useShortcutKeys', useShortcutKeys.toString())
    localStorage.setItem('dontSaveAIHistory', dontSaveAIHistory.toString())
    
    onSave(settings)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-blue-50 border-2 border-gray-300 rounded-lg shadow-xl w-full max-w-lg mx-4 p-8 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="閉じる"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-900 mb-6">APIキーの入力</h2>

        {/* API Key Input */}
        <div className="mb-6">
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="APIキーを入力してください"
            className="w-full h-12 text-base"
          />
        </div>

        {/* Checkboxes */}
        <div className="space-y-4 mb-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={useShortcutKeys}
              onChange={(e) => setUseShortcutKeys(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">ショートカットキーを使用する</span>
          </label>

          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={dontSaveAIHistory}
              onChange={(e) => setDontSaveAIHistory(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">AIの履歴を保存しない</span>
          </label>
        </div>

        {/* Save Button */}
        <div className="flex justify-center">
          <Button onClick={handleSave} className="px-8">
            設定を保存
          </Button>
        </div>
      </div>
    </div>
  )
}

