/**
 * 辞書入力モーダルコンポーネント
 * 辞書追加時のプロンプト入力・自由テキスト入力画面
 */

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { X, ArrowRight } from 'lucide-react'

interface DictionaryInputModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (text: string) => void
  onNext?: (text: string) => void
}

export const DictionaryInputModal: React.FC<DictionaryInputModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onNext
}) => {
  const [inputText, setInputText] = useState('')

  const handleSave = () => {
    if (inputText.trim()) {
      onSave(inputText)
      setInputText('')
      onClose()
    }
  }

  const handleNext = () => {
    if (inputText.trim()) {
      if (onNext) {
        onNext(inputText)
        setInputText('')
        onClose()
      } else {
        handleSave()
      }
    }
  }

  const handleClose = () => {
    setInputText('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-blue-50 border-2 border-red-500 rounded-lg shadow-xl w-full max-w-2xl mx-4 p-6 relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="閉じる"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Note</h2>

        {/* Input Area */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            プロンプト入力・自由テキスト入力
          </label>
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="プロンプトまたは自由テキストを入力してください..."
            className="w-full min-h-[300px] text-base resize-none bg-blue-50"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between gap-4">
          <Button
            onClick={handleSave}
            variant="outline"
            className="flex-1 border border-gray-300 hover:border-gray-400"
            disabled={!inputText.trim()}
          >
            テキストを保存
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1 border-2 border-red-500 hover:border-red-600"
            disabled={!inputText.trim()}
          >
            <ArrowRight className="h-4 w-4 mr-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}

