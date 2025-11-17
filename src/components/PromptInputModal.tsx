/**
 * プロンプト入力モーダルコンポーネント
 * 文章追加時のプロンプト入力画面
 */

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { X, ArrowRight } from 'lucide-react'

interface PromptInputModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (text: string) => void
  onNext?: (prompt: string) => void
}

export const PromptInputModal: React.FC<PromptInputModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onNext
}) => {
  const [promptText, setPromptText] = useState('')

  const handleSave = () => {
    if (promptText.trim()) {
      onSave(promptText)
      setPromptText('')
      onClose()
    }
  }

  const handleNext = () => {
    if (promptText.trim()) {
      if (onNext) {
        onNext(promptText)
        setPromptText('')
        onClose()
      } else {
        handleSave()
      }
    }
  }

  const handleClose = () => {
    setPromptText('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-blue-50 border-2 border-gray-300 rounded-lg shadow-xl w-full max-w-2xl mx-4 p-6 relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="閉じる"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-900 mb-4">プロンプト入力</h2>

        {/* Input Area */}
        <div className="mb-6">
          <Textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="プロンプトを入力してください..."
            className="w-full min-h-[300px] text-base resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between gap-4">
          <Button
            onClick={handleSave}
            variant="outline"
            className="flex-1 border border-gray-300 hover:border-gray-400"
            disabled={!promptText.trim()}
          >
            テキストを保存
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1"
            disabled={!promptText.trim()}
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            次へ
          </Button>
        </div>
      </div>
    </div>
  )
}

