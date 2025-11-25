/**
 * 辞書入力モーダルコンポーネント
 * 辞書追加時のプロンプト入力・自由テキスト入力画面
 */

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import { X, ArrowRight } from 'lucide-react'

interface DictionaryInputModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (entry: { term: string; description: string }) => void
  onNext?: (entry: { term: string; description: string }) => void
  mode?: 'create' | 'edit'
  initialEntry?: { term: string; description: string }
}

export const DictionaryInputModal: React.FC<DictionaryInputModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onNext,
  mode = 'create',
  initialEntry
}) => {
  const [term, setTerm] = useState('')
  const [description, setDescription] = useState('')

  React.useEffect(() => {
    if (isOpen) {
      setTerm(initialEntry?.term ?? '')
      setDescription(initialEntry?.description ?? '')
    }
  }, [isOpen, initialEntry])

  const handleSave = () => {
    if (term.trim() && description.trim()) {
      onSave({ term, description })
      setTerm('')
      setDescription('')
      onClose()
    }
  }

  const handleNext = () => {
    if (mode === 'edit' || !onNext) {
      handleSave()
      return
    }

    if (term.trim() && description.trim()) {
      onNext({ term, description })
      setTerm('')
      setDescription('')
      onClose()
    }
  }

  const handleClose = () => {
    setTerm('')
    setDescription('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-blue-50 rounded-lg shadow-xl w-full max-w-2xl mx-4 p-6 relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="閉じる"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {mode === 'edit' ? '辞書エントリの編集' : '辞書エントリの追加'}
        </h2>

        {/* Input Area */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              用語
            </label>
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="例: 魔法石"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              詳細
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="用語の説明や背景を入力してください..."
              className="w-full min-h-[220px] text-base resize-none bg-blue-50"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between gap-4">
          <Button
            onClick={handleSave}
            variant="outline"
            className="flex-1 border border-gray-300 hover:border-gray-400"
            disabled={!term.trim() || !description.trim()}
          >
            {mode === 'edit' ? '更新する' : 'テキストを保存'}
          </Button>
          {mode === 'create' && onNext && (
            <Button
              onClick={handleNext}
              className="flex-1"
              disabled={!term.trim() || !description.trim()}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

