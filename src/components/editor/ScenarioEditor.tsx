import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import { mockDataService } from '@/services/mockDataService'
import { useAuth } from '@/components/providers/MockAuthProvider'
import { 
  Save, 
  Sparkles, 
  Plus, 
  Copy, 
  Download
} from 'lucide-react'

interface ScenarioEditorProps {
  initialContent?: string
  onSave?: (scenario: any) => void
  onLoad?: () => void
}

export const ScenarioEditor: React.FC<ScenarioEditorProps> = ({
  initialContent = '',
  onSave
}) => {
  const { user } = useAuth()
  const [content, setContent] = useState(initialContent)
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [scenarioId, setScenarioId] = useState<string | null>(null)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // AI completion function using mock data
  const generateAICompletion = async () => {
    setIsGenerating(true)
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const suggestions = mockDataService.generateAISuggestions()
      setAiSuggestions(suggestions)
    } catch (error) {
      console.error('AI completion error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    setCursorPosition(e.target.selectionStart)
  }

  const handleCursorPosition = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart)
    }
  }

  const insertSuggestion = (suggestion: string) => {
    const beforeCursor = content.substring(0, cursorPosition)
    const afterCursor = content.substring(cursorPosition)
    const newContent = beforeCursor + suggestion + afterCursor
    setContent(newContent)
    setAiSuggestions([])
    
    // Focus back to textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = cursorPosition + suggestion.length
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newPosition, newPosition)
      }
    }, 100)
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSave = () => {
    if (!user) {
      alert('ログインが必要です')
      return
    }

    try {
      if (scenarioId) {
        // Update existing scenario
        mockDataService.updateScenario(scenarioId, {
          title,
          content,
          tags,
          isPublic
        })
      } else {
        // Create new scenario
        const newId = mockDataService.createScenario({
          title: title || '無題のシナリオ',
          content,
          tags,
          isPublic,
          authorId: user.uid
        })
        setScenarioId(newId)
      }
      
      if (onSave) {
        onSave({
          title,
          content,
          tags,
          isPublic
        })
      }
      
      alert('シナリオが保存されました！')
    } catch (error) {
      console.error('Save error:', error)
      alert('保存に失敗しました')
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content)
      alert('クリップボードにコピーしました')
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  const exportContent = () => {
    const dataStr = JSON.stringify({
      title,
      content,
      tags,
      isPublic,
      timestamp: new Date().toISOString()
    }, null, 2)
    
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${title || 'scenario'}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">シナリオエディター</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={copyToClipboard}>
            <Copy className="h-4 w-4 mr-2" />
            コピー
          </Button>
          <Button variant="outline" onClick={exportContent}>
            <Download className="h-4 w-4 mr-2" />
            エクスポート
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            保存
          </Button>
        </div>
      </div>

      {/* Title and Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="タイトル"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="シナリオのタイトルを入力"
        />
        
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">公開</span>
          </label>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          タグ
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="ml-2 text-primary-600 hover:text-primary-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex space-x-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="新しいタグを入力"
            onKeyPress={(e) => e.key === 'Enter' && addTag()}
          />
          <Button variant="outline" onClick={addTag}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* AI Completion */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
            AI補完
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateAICompletion()}
            disabled={isGenerating}
          >
            {isGenerating ? '生成中...' : '続きを生成'}
          </Button>
        </div>
        
        {aiSuggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">以下の提案から選択してください：</p>
            {aiSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="ai-suggestion cursor-pointer"
                onClick={() => insertSuggestion(suggestion)}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Editor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          シナリオ内容
        </label>
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextChange}
          onSelect={handleCursorPosition}
          onFocus={handleCursorPosition}
          placeholder="シナリオの内容を入力してください..."
          className="min-h-96 font-mono text-base leading-relaxed"
        />
        <div className="mt-2 text-sm text-gray-500">
          文字数: {content.length} | カーソル位置: {cursorPosition}
        </div>
      </div>

      {/* Character Count and Stats */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">統計情報</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">文字数:</span>
            <span className="ml-2 font-medium">{content.length}</span>
          </div>
          <div>
            <span className="text-gray-500">単語数:</span>
            <span className="ml-2 font-medium">{content.split(/\s+/).filter(word => word.length > 0).length}</span>
          </div>
          <div>
            <span className="text-gray-500">行数:</span>
            <span className="ml-2 font-medium">{content.split('\n').length}</span>
          </div>
          <div>
            <span className="text-gray-500">段落数:</span>
            <span className="ml-2 font-medium">{content.split('\n\n').filter(p => p.trim().length > 0).length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}




