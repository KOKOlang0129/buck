import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/components/providers/MockAuthProvider'
import { Button } from '@/components/ui/Button'
import { SettingsModal, SettingsData } from '@/components/SettingsModal'
import { mockDataService, Scenario } from '@/services/mockDataService'
import { Plus, Settings, LogOut, Search, ChevronRight } from 'lucide-react'

const VIEW_MODES = ['outline', 'plain', 'preview', 'markdown'] as const

const DashboardPage: React.FC = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [scenarios, setScenarios] = React.useState<Scenario[]>([])
  const [isLoadingScenarios, setIsLoadingScenarios] = React.useState(true)
  const [selectedScenarioId, setSelectedScenarioId] = React.useState<string | null>(null)
  const [viewMode, setViewMode] = React.useState<(typeof VIEW_MODES)[number]>('outline')
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
  const [editorContent, setEditorContent] = React.useState('')
  const [projectName, setProjectName] = React.useState('')

  React.useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  React.useEffect(() => {
    if (user) {
      loadScenarios()
    }
  }, [user])

  React.useEffect(() => {
    if (scenarios.length > 0 && !selectedScenarioId) {
      setSelectedScenarioId(scenarios[0].id)
    }
  }, [scenarios, selectedScenarioId])

  const selectedScenario = scenarios.find((scenario) => scenario.id === selectedScenarioId) || null

  React.useEffect(() => {
    if (selectedScenario) {
      setEditorContent(selectedScenario.content)
      setProjectName(selectedScenario.title)
    } else {
      setEditorContent('')
      setProjectName('')
    }
  }, [selectedScenario])

  const handleProjectNameChange = (newName: string) => {
    setProjectName(newName)
    if (selectedScenario && user) {
      mockDataService.updateScenario(selectedScenario.id, {
        title: newName
      })
      loadScenarios()
    }
  }

  const loadScenarios = async () => {
    try {
      if (user) {
        const userScenarios = mockDataService.getUserScenarios(user.uid)
        setScenarios(userScenarios)
      }
    } catch (error) {
      console.error('Error loading scenarios:', error)
    } finally {
      setIsLoadingScenarios(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const handleCreateScenario = () => {
    if (!user) return
    const newId = mockDataService.createScenario({
      title: '新しいプロジェクト',
      content: 'ここに新しいシナリオを作成してください。',
      tags: [],
      isPublic: false,
      authorId: user.uid
    })
    loadScenarios()
    setSelectedScenarioId(newId)
  }

  const handleSaveSettings = (settings: SettingsData) => {
    console.log('Settings saved:', settings)
    // 設定を保存した後の処理（必要に応じて実装）
  }

  const handleContentChange = (newContent: string) => {
    setEditorContent(newContent)
    if (selectedScenario && user) {
      mockDataService.updateScenario(selectedScenario.id, {
        content: newContent
      })
    }
  }

  const handleAddArticle = () => {
    const newContent = editorContent + '\n\n## 新しいセクション\n\n'
    handleContentChange(newContent)
  }

  const handleAddTag = () => {
    const tag = prompt('タグ名を入力してください:')
    if (tag && selectedScenario) {
      const currentTags = selectedScenario.tags || []
      if (!currentTags.includes(tag)) {
        mockDataService.updateScenario(selectedScenario.id, {
          tags: [...currentTags, tag]
        })
        loadScenarios()
      }
    }
  }

  const handleAddDictionary = () => {
    alert('辞書の追加機能は今後実装予定です')
  }

  const handleSearchMaterials = () => {
    alert('資料の検索機能は今後実装予定です')
  }

  const handleProofreadRange = () => {
    alert('範囲を校正機能は今後実装予定です')
  }

  const outlineItems = React.useMemo(() => {
    if (!editorContent) return []
    const lines = editorContent.split('\n')
    const headers: Array<{ level: number; text: string }> = []
    
    lines.forEach((line) => {
      const trimmed = line.trim()
      if (trimmed.startsWith('#')) {
        const match = trimmed.match(/^(#+)\s+(.+)$/)
        if (match) {
          headers.push({
            level: match[1].length,
            text: match[2]
          })
        }
      } else if (trimmed.length > 0 && headers.length < 12) {
        // ヘッダーがない場合は最初の数行を表示
        if (headers.length === 0 || headers[headers.length - 1].level === 0) {
          headers.push({
            level: 0,
            text: trimmed.substring(0, 50)
          })
        }
      }
    })
    
    return headers.slice(0, 12)
  }, [editorContent])

  if (isLoadingScenarios) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-700">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-400" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold tracking-wide text-gray-600 mb-4">初期画面</p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                プロジェクトの名前
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => handleProjectNameChange(e.target.value)}
                placeholder="プロジェクト名を入力"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="px-6" onClick={() => setIsSettingsOpen(true)}>
                <Settings className="h-4 w-4 mr-2" />
                設定
              </Button>
              <Button variant="outline" className="px-6" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                ログアウト
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_220px] gap-6">
          {/* Project List */}
          <aside className="border border-gray-300 bg-white rounded-lg p-4 flex flex-col h-full min-h-[520px]">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">プロジェクト一覧</h2>
            <div className="space-y-2 flex-1 overflow-auto pr-1">
              {scenarios.length === 0 ? (
                <p className="text-sm text-gray-500">まだプロジェクトがありません。</p>
              ) : (
                scenarios.map((scenario) => (
                  <button
                    key={scenario.id}
                    onClick={() => setSelectedScenarioId(scenario.id)}
                    className={`w-full text-left px-3 py-2 rounded-md border ${
                      selectedScenarioId === scenario.id
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-300 bg-white hover:bg-gray-50'
                    } transition`}
                  >
                    <p className="text-sm font-medium truncate">{scenario.title}</p>
                  </button>
                ))
              )}
            </div>
            <Button
              variant="outline"
              onClick={handleCreateScenario}
              className="mt-4 w-full justify-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              新規作成
            </Button>
          </aside>

          {/* Main Editor */}
          <section className="border border-gray-300 bg-white rounded-lg p-6 min-h-[520px] flex flex-col">
            <div className="flex items-center flex-wrap gap-3 mb-6">
              <span className="text-sm font-semibold text-gray-700">ViewMode</span>
              <div className="flex flex-wrap gap-2">
                {VIEW_MODES.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-4 py-1.5 rounded-md border text-sm capitalize ${
                      viewMode === mode
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-300 bg-white hover:bg-gray-50'
                    } transition`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-6 flex-1">
              {viewMode === 'outline' && (
                <div className="border border-gray-200 rounded-md p-4 bg-gray-50 overflow-auto">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Outline</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    {outlineItems.length > 0 ? (
                      outlineItems.map((item, index) => (
                        <div
                          key={`${item.text}-${index}`}
                          className={`truncate ${item.level === 0 ? 'pl-0' : item.level === 1 ? 'pl-0' : item.level === 2 ? 'pl-4' : 'pl-8'}`}
                        >
                          {item.level > 0 ? `header${item.level}: ` : ''}{item.text}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400">アウトラインはまだありません。</p>
                    )}
                  </div>
                </div>
              )}
              <div className={`border border-gray-200 rounded-md p-4 overflow-auto bg-white ${viewMode === 'outline' ? '' : 'md:col-span-2'}`}>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Main Editor</h3>
                {selectedScenario ? (
                  viewMode === 'plain' || viewMode === 'outline' ? (
                    <textarea
                      value={editorContent}
                      onChange={(e) => handleContentChange(e.target.value)}
                      className="w-full h-full min-h-[400px] text-sm leading-relaxed text-gray-700 font-mono resize-none border-none outline-none"
                      placeholder="ここに内容を入力してください..."
                    />
                  ) : viewMode === 'preview' ? (
                    <div className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700 prose prose-sm max-w-none">
                      {editorContent}
                    </div>
                  ) : (
                    <div className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700 font-mono">
                      {editorContent}
                    </div>
                  )
                ) : (
                  <p className="text-sm text-gray-500">プロジェクトを選択すると内容が表示されます。</p>
                )}
              </div>
            </div>
          </section>

          {/* Action Panel */}
          <aside className="border border-gray-300 bg-white rounded-lg p-4 flex flex-col space-y-3 min-h-[520px]">
            <button 
              onClick={handleAddArticle}
              className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm text-left hover:bg-gray-50 transition"
            >
              ＋ 文章の追加
            </button>
            <button 
              onClick={handleAddTag}
              className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm text-left hover:bg-gray-50 transition"
            >
              ＋ タグの追加
            </button>
            <button 
              onClick={handleAddDictionary}
              className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm text-left hover:bg-gray-50 transition"
            >
              ＋ 辞書の追加
            </button>
            <button 
              onClick={handleSearchMaterials}
              className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm text-left hover:bg-gray-50 transition flex items-center"
            >
              <Search className="h-4 w-4 mr-2" /> 資料の検索
            </button>
            <button 
              onClick={handleProofreadRange}
              className="w-full border border-gray-900 rounded-md px-4 py-3 text-sm text-left hover:bg-gray-900 hover:text-white transition flex items-center justify-between"
            >
              <span>範囲を校正</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </aside>
        </div>

        {/* AI usage note */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
          <div>
            <p className="font-semibold mb-2">AIの使用用途</p>
            <ul className="list-disc list-inside space-y-1">
              <li>文章の生成</li>
              <li>資料の校正</li>
              <li>資料の収集</li>
              <li>要約</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
      />
    </div>
  )
}

export default DashboardPage
