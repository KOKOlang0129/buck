import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/components/providers/MockAuthProvider'
import { Button } from '@/components/ui/Button'
import { SettingsModal, SettingsData } from '@/components/SettingsModal'
import { PromptInputModal } from '@/components/PromptInputModal'
import { DictionaryInputModal } from '@/components/DictionaryInputModal'
import { mockDataService, Scenario } from '@/services/mockDataService'
import { aiAPI } from '@/lib/api'
import { Plus, Settings, LogOut, Search, ChevronRight, X, Minus } from 'lucide-react'

const VIEW_MODES = ['outline', 'plain', 'preview', 'markdown'] as const

const DEFAULT_PREVIEW_CONTENT = `
### 一章　冷たい朝
窓の外では、灰色の空が静かに澱んでいる。  
雨粒がガラスを伝い、ひとつひとつの呼吸のように流れていく。  
目を覚ましても、世界はまだ眠っているようだった。

### 二章　傘の下の世界
通りには、人の影がぽつぽつと揺れている。  
傘の布地を叩く音が、唯一のリズム。  
すれ違う誰かの温度が、雨に溶けて消えていった。

### 三章　湯気の向こう
喫茶店の扉を開けると、温かな香りが迎えてくれる。  
コーヒーの湯気が曇った眼鏡を曇らせ、世界を少し柔らかくした。
`

const DEFAULT_MARKDOWN_CONTENT = `# 雨の日の幸

## 一章　冷たい朝
窓の外では、灰色の空が静かに澱んでいる。
雨粒がガラスを伝い、ひとつひとつの呼吸のように流れていく。
目を覚ましても、世界はまだ眠っているようだった。

## 二章　傘の下の世界
通りには、人の影がぽつぽつと揺れている。
傘の布地を叩く音が、唯一のリズム。
すれ違う誰かの温度が、雨に溶けて消えていった。

## 三章　湯気の向こう
喫茶店の扉を開けると、温かな香りが迎えてくれる。
コーヒーの湯気が曇った眼鏡を曇らせ、世界を少し柔らかくした。
`

const DashboardPage: React.FC = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [scenarios, setScenarios] = React.useState<Scenario[]>([])
  const [isLoadingScenarios, setIsLoadingScenarios] = React.useState(true)
  const [selectedScenarioId, setSelectedScenarioId] = React.useState<string | null>(null)
  const [viewMode, setViewMode] = React.useState<(typeof VIEW_MODES)[number] | null>('plain')
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
  const [isPromptInputOpen, setIsPromptInputOpen] = React.useState(false)
  const [editorContent, setEditorContent] = React.useState(DEFAULT_MARKDOWN_CONTENT)
  const [projectName, setProjectName] = React.useState('')
  const [generatedText, setGeneratedText] = React.useState('')
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [showTagManager, setShowTagManager] = React.useState(false)
  const [tagPreview, setTagPreview] = React.useState('')
  const [showDictionaryManager, setShowDictionaryManager] = React.useState(false)
  const [isDictionaryInputOpen, setIsDictionaryInputOpen] = React.useState(false)
  const [dictionaryItems, setDictionaryItems] = React.useState<Array<{ id: string; name: string; description: string }>>([])
  const [showProofreadMode, setShowProofreadMode] = React.useState(false)
  const [customPanels, setCustomPanels] = React.useState<Array<{ id: string; title: string; content: string }>>([
    { id: 'summary', title: 'あらすじ', content: '' },
    { id: 'note', title: 'Note', content: '' },
    { id: 'vocabulary', title: '単語帳', content: '' },
    { id: 'memo', title: 'メモ', content: '' }
  ])
  const [expandedChapters, setExpandedChapters] = React.useState<Set<string>>(new Set())

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
    setIsPromptInputOpen(true)
  }

  const handleSavePromptText = (text: string) => {
    // 入力したテキストを生成テキストボックスに表示
    setGeneratedText(text)
  }

  const handleGenerateText = async (prompt: string) => {
    setIsGenerating(true)
    try {
      // モック実装: 実際のAPIが利用可能になるまで、ダミーテキストを返す
      // 実際の実装では、aiAPI.generateText(prompt) を呼び出す
      await new Promise(resolve => setTimeout(resolve, 1500)) // ローディングをシミュレート
      
      // モックレスポンス
      const mockGeneratedText = `【生成されたテキスト】\n\n${prompt}に基づいて生成されたテキストがここに表示されます。\n\n実際の実装では、AI API（ChatGPTまたはClaude）から取得したテキストが表示されます。`
      
      setGeneratedText(mockGeneratedText)
      
      // 実際のAPI呼び出し（コメントアウト）
      // const response = await aiAPI.generateText(prompt)
      // setGeneratedText(response.text || response.message || 'テキストの生成に失敗しました。')
    } catch (error) {
      console.error('Text generation error:', error)
      setGeneratedText('テキストの生成中にエラーが発生しました。')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAddTag = () => {
    setShowTagManager(true)
    // タグファイルのプレビューを生成（tag.mdは自動生成）
    if (selectedScenario) {
      const tags = selectedScenario.tags || []
      const tagContent = tags.length > 0 
        ? tags.map(tag => `# ${tag}`).join('\n\n')
        : '# main'
      setTagPreview(tagContent || '# main')
    } else {
      setTagPreview('# main')
    }
  }

  const handleCloseTagManager = () => {
    setShowTagManager(false)
  }

  const handleAddNewTag = () => {
    const tag = prompt('タグ名を入力してください:')
    if (tag && selectedScenario) {
      const currentTags = selectedScenario.tags || []
      if (!currentTags.includes(tag)) {
        mockDataService.updateScenario(selectedScenario.id, {
          tags: [...currentTags, tag]
        })
        loadScenarios()
        // プレビューを更新
        const updatedTags = [...currentTags, tag]
        const tagContent = updatedTags.map(t => `# ${t}`).join('\n\n')
        setTagPreview(tagContent)
      }
    }
  }

  const handleAddDictionary = () => {
    if (showDictionaryManager) {
      // 辞書管理UIが表示されている場合は、モーダルを開く
      setIsDictionaryInputOpen(true)
    } else {
      // 辞書管理UIが表示されていない場合は、辞書管理UIを表示
      setShowDictionaryManager(true)
    }
  }

  const handleSaveDictionaryText = (text: string) => {
    // 辞書テキストを保存する処理（今後実装）
    console.log('Dictionary text saved:', text)
  }

  const handleAddDictionaryItem = (text: string) => {
    // 辞書アイテムを追加（辞書.mdが追加される）
    const newItem = {
      id: `dict-${Date.now()}`,
      name: 'Main',
      description: text || 'メインの文章について書かれている'
    }
    setDictionaryItems([...dictionaryItems, newItem])
    // 辞書管理UIを表示
    setShowDictionaryManager(true)
  }

  const handleCloseDictionaryManager = () => {
    setShowDictionaryManager(false)
  }

  const handleSearchMaterials = () => {
    alert('資料の検索機能は今後実装予定です')
  }

  const handleProofreadRange = () => {
    setShowProofreadMode(true)
  }

  const handleCloseProofreadMode = () => {
    setShowProofreadMode(false)
  }

  const handleUpdatePanelTitle = (id: string, newTitle: string) => {
    setCustomPanels(customPanels.map(panel => 
      panel.id === id ? { ...panel, title: newTitle } : panel
    ))
  }

  const handleRemovePanel = (id: string) => {
    setCustomPanels(customPanels.filter(panel => panel.id !== id))
  }

  const handleAddCustomPanel = () => {
    const newPanel = {
      id: `panel-${Date.now()}`,
      title: '新しいパネル',
      content: ''
    }
    setCustomPanels([...customPanels, newPanel])
  }

  const outlineItems = React.useMemo(() => {
    if (!editorContent) return []
    const lines = editorContent.split('\n')
    const headers: Array<{ level: number; text: string; id: string }> = []
    
    lines.forEach((line, index) => {
      const trimmed = line.trim()
      if (trimmed.startsWith('#')) {
        const match = trimmed.match(/^(#+)\s+(.+)$/)
        if (match) {
          headers.push({
            level: match[1].length,
            text: match[2],
            id: `header-${index}`
          })
        }
      } else if (trimmed.length > 0 && headers.length < 50) {
        // ヘッダーがない場合は最初の数行を表示
        if (headers.length === 0 || headers[headers.length - 1].level === 0) {
          headers.push({
            level: 0,
            text: trimmed.substring(0, 50),
            id: `line-${index}`
          })
        }
      }
    })
    
    return headers
  }, [editorContent])

  const toggleChapter = (id: string) => {
    const newExpanded = new Set(expandedChapters)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedChapters(newExpanded)
  }

  // MarkdownをHTMLに変換する関数（シンプルな実装）
  const renderMarkdown = (text: string): string => {
    if (!text) return ''
    
    let html = text
      // 見出し
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // 太字
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      // 斜体
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      // リンク
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>')
      // リスト
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/^\+ (.*$)/gim, '<li>$1</li>')
      // コードブロック
      .replace(/```([^`]+)```/g, '<pre class="bg-gray-100 p-2 rounded"><code>$1</code></pre>')
      // インラインコード
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
      // 改行
      .replace(/\n/g, '<br />')
    
    // リストをulタグで囲む
    html = html.replace(/(<li>.*<\/li>)/g, (match) => {
      if (!match.includes('<ul>')) {
        return '<ul class="list-disc list-inside my-2">' + match + '</ul>'
      }
      return match
    })
    
    return html
  }

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
          <aside className="border border-gray-300 bg-white rounded-lg p-4 flex flex-col h-[794px]">
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
          <section className="border border-gray-300 bg-white rounded-lg p-6 h-[794px] flex flex-col">
            <div className="flex items-center flex-wrap gap-3 mb-6">
              <span className="text-sm font-semibold text-gray-700">ViewMode</span>
              <div className="flex flex-wrap gap-2">
                {VIEW_MODES.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-4 py-1.5 rounded-md border text-sm capitalize ${
                      viewMode === mode
                        ? (mode === 'plain' || mode === 'outline' || mode === 'preview' || mode === 'markdown')
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-300 bg-white hover:bg-gray-50'
                    } transition`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-6 flex-1">
              {(viewMode === 'outline' || viewMode === 'plain' || viewMode === 'preview' || viewMode === 'markdown' || viewMode === null) && (
                <div className="border border-gray-200 rounded-md p-4 bg-gray-50 overflow-auto" style={{ maxHeight: 'calc(794px - 120px)' }}>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Outline</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    {outlineItems.length > 0 ? (
                      outlineItems.map((item, index) => (
                        <div
                          key={`${item.id}-${index}`}
                          className={`truncate cursor-pointer hover:bg-gray-100 px-2 py-1 rounded ${item.level === 0 ? 'pl-0' : item.level === 1 ? 'pl-0' : item.level === 2 ? 'pl-4' : 'pl-8'}`}
                          onClick={() => toggleChapter(item.id)}
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
              <div className={`border border-gray-200 rounded-md p-4 overflow-auto bg-white ${(viewMode === 'outline' || viewMode === 'plain' || viewMode === 'preview' || viewMode === 'markdown' || viewMode === null) ? '' : 'md:col-span-2'}`} style={{ maxHeight: 'calc(794px - 120px)' }}>
                {selectedScenario ? (
                  viewMode === null ? (
                    <div className="relative h-full min-h-[400px] flex items-center justify-center bg-white">
                      <div className="absolute left-6 bottom-16 w-2/3 border-t border-dashed border-gray-300 rotate-[-12deg]" />
                      <span className="text-lg font-semibold text-gray-600 bg-white px-3 py-1 shadow-sm rounded">
                        Main Editor
                      </span>
                    </div>
                  ) : viewMode === 'outline' ? (
                    <div className="h-full min-h-[400px] flex flex-col">
                      {outlineItems.length > 0 ? (
                        <div className="flex-1">
                          <div className="space-y-2 text-sm text-gray-700">
                            {outlineItems.map((item, index) => (
                              <div
                                key={`outline-main-${item.id}-${index}`}
                                className="flex gap-4 items-start border border-transparent hover:border-gray-200 rounded px-3 py-1 transition-colors"
                              >
                                <span className="text-gray-500 min-w-[3rem]">
                                  {index + 1}章
                                </span>
                                <span className="font-medium">{item.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
                          アウトラインはまだありません。
                        </div>
                      )}
                      <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500 space-y-1">
                        <p>いわゆるアウトラインエディタモード</p>
                        <p>本文は折りたたまれている</p>
                        <p>header要素をドラッグ・アンド・ドロップできる</p>
                      </div>
                    </div>
                  ) : viewMode === 'plain' ? (
                    <div className="h-full flex flex-col min-h-[400px]">
                      <textarea
                        value={editorContent}
                        onChange={(e) => handleContentChange(e.target.value)}
                        className="w-full flex-1 text-sm leading-relaxed text-gray-700 resize-none border-none outline-none font-sans"
                        placeholder="ここにプレーンテキストで内容を入力してください..."
                        style={{ fontFamily: 'inherit', minHeight: '320px' }}
                      />
                      <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500 space-y-1">
                        <p>プレーンテキストモード</p>
                        <p>markdownのレンダリングが使用されない</p>
                        <p>読み・書き下ろしのためのモード</p>
                      </div>
                    </div>
                  ) : viewMode === 'preview' ? (
                    <div className="h-full min-h-[400px]">
                      <div
                        className="text-sm leading-relaxed text-gray-700 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(editorContent || DEFAULT_PREVIEW_CONTENT) }}
                      />
                      <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500 space-y-1">
                        <p>このツールでは表現できないが、強調表示やリストなど</p>
                        <p>markdownのレンダリング表示モード</p>
                        <p>リンクや辞書などをハイライト表示</p>
                      </div>
                    </div>
                  ) : viewMode === 'markdown' ? (
                    <div className="h-full flex flex-col min-h-[400px]">
                      <textarea
                        value={editorContent}
                        onChange={(e) => handleContentChange(e.target.value)}
                        className="w-full flex-1 text-sm leading-relaxed text-gray-700 font-mono resize-none border-none outline-none"
                        placeholder="ここにMarkdown形式で内容を入力してください..."
                        style={{ minHeight: '400px' }}
                      />
                      <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-center text-gray-500">
                        <p>markdown 編集モード</p>
                      </div>
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

          {/* Action Panel / Tag Manager / Dictionary Manager / Proofread Mode */}
          {showProofreadMode ? (
            <aside className="border border-gray-300 bg-white rounded-lg p-4 flex flex-col h-[794px] space-y-3">
              {/* Custom Panels */}
              {customPanels.map((panel) => (
                <div key={panel.id} className="border border-gray-300 rounded-md bg-white">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
                    <input
                      type="text"
                      value={panel.title}
                      onChange={(e) => handleUpdatePanelTitle(panel.id, e.target.value)}
                      className="text-sm font-semibold text-gray-700 bg-transparent border-none outline-none focus:bg-gray-50 px-1 rounded"
                      onBlur={(e) => {
                        if (!e.target.value.trim()) {
                          handleUpdatePanelTitle(panel.id, '新しいパネル')
                        }
                      }}
                    />
                    <button
                      onClick={() => handleRemovePanel(panel.id)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="閉じる"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="px-3 py-2 min-h-[80px]">
                    <textarea
                      value={panel.content}
                      onChange={(e) => {
                        setCustomPanels(customPanels.map(p => 
                          p.id === panel.id ? { ...p, content: e.target.value } : p
                        ))
                      }}
                      className="w-full text-sm text-gray-700 border-none outline-none resize-none"
                      placeholder="内容を入力..."
                      rows={3}
                    />
                  </div>
                </div>
              ))}

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-2 gap-2 mt-auto">
                <button 
                  onClick={handleAddArticle}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm text-left hover:bg-gray-50 transition"
                >
                  ＋ 文章の追加
                </button>
                <button 
                  onClick={handleAddDictionary}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm text-left hover:bg-gray-50 transition"
                >
                  ＋ 辞書の追加
                </button>
                <button 
                  onClick={handleAddTag}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm text-left hover:bg-gray-50 transition"
                >
                  ＋ タグの追加
                </button>
                <button 
                  onClick={handleProofreadRange}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm text-left hover:bg-gray-50 transition flex items-center justify-between"
                >
                  <span>範囲を校正</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </aside>
          ) : showDictionaryManager ? (
            <aside className="border border-gray-300 bg-white rounded-lg p-4 flex flex-col h-[794px] space-y-3">
              {/* あらすじ Window */}
              <div className="border border-gray-300 rounded-md bg-white">
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700">あらすじ</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCloseDictionaryManager}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="最小化"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCloseDictionaryManager}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="閉じる"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="px-3 py-2 min-h-[80px]">
                  <textarea
                    className="w-full text-sm text-gray-700 border-none outline-none resize-none"
                    placeholder="あらすじを入力..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Note Window */}
              <div className="border border-gray-300 rounded-md bg-white">
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700">Note</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCloseDictionaryManager}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="最小化"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCloseDictionaryManager}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="閉じる"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="px-3 py-2 min-h-[80px]">
                  <textarea
                    className="w-full text-sm text-gray-700 border-none outline-none resize-none"
                    placeholder="ノートを入力..."
                    rows={3}
                  />
                </div>
              </div>

              {/* タグ Window */}
              <div className="border border-gray-300 rounded-md bg-white">
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700">タグ</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCloseDictionaryManager}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="最小化"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCloseDictionaryManager}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="閉じる"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="px-3 py-2 flex items-center gap-2">
                  <span className="text-sm text-gray-700">タグ</span>
                  <button className="px-3 py-1 bg-yellow-200 hover:bg-yellow-300 rounded-md text-sm text-gray-700 transition-colors">
                    Main
                  </button>
                  <button className="px-3 py-1 border border-gray-300 hover:bg-gray-50 rounded-md text-sm text-gray-700 transition-colors">
                    +説明を追加
                  </button>
                </div>
              </div>

              {/* 辞書 Windows */}
              {dictionaryItems.map((item) => (
                <div key={item.id} className="border border-gray-300 rounded-md bg-white">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700">辞書</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCloseDictionaryManager}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="最小化"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setDictionaryItems(dictionaryItems.filter(d => d.id !== item.id))
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="閉じる"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-gray-700 mb-1">{item.name}</p>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-2 gap-2 mt-auto">
                <button 
                  onClick={handleAddArticle}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm text-left hover:bg-gray-50 transition"
                >
                  ＋ 文章の追加
                </button>
                <button 
                  onClick={handleAddDictionary}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm text-left hover:bg-gray-50 transition"
                >
                  ＋ 辞書の追加
                </button>
                <button 
                  onClick={handleAddTag}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm text-left hover:bg-gray-50 transition"
                >
                  ＋ タグの追加
                </button>
                <button 
                  onClick={handleProofreadRange}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm text-left hover:bg-gray-50 transition flex items-center justify-between"
                >
                  <span>範囲を校正</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </aside>
          ) : showTagManager ? (
            <aside className="border border-gray-300 bg-white rounded-lg p-4 flex flex-col min-h-[794px]">
              {/* Tag Window */}
              <div className="border border-gray-300 rounded-md bg-white mb-4">
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700">タグ</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCloseTagManager}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="最小化"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCloseTagManager}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="閉じる"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="px-3 py-2">
                  <p className="text-sm text-gray-700">main</p>
                </div>
              </div>

              {/* Preview Area */}
              <div className="flex-1 border border-gray-200 rounded-md bg-white p-4 mb-4 overflow-auto">
                <p className="text-xs text-gray-500 mb-2">追加されたファイルのプレビューが出る</p>
                <div className="min-h-[200px]">
                  {tagPreview ? (
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">{tagPreview}</pre>
                  ) : (
                    <p className="text-sm text-gray-400">プレビューがここに表示されます</p>
                  )}
                </div>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={handleAddArticle}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm text-left hover:bg-gray-50 transition"
                >
                  ＋ 文章の追加
                </button>
                <button 
                  onClick={handleAddDictionary}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm text-left hover:bg-gray-50 transition"
                >
                  ＋ 辞書の追加
                </button>
                <button 
                  onClick={handleAddNewTag}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm text-left hover:bg-gray-50 transition"
                >
                  ＋ タグの追加
                </button>
                <button 
                  onClick={handleProofreadRange}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm text-left hover:bg-gray-50 transition flex items-center justify-between"
                >
                  <span>範囲を校正</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </aside>
          ) : (
          <aside className="border border-gray-300 bg-white rounded-lg p-4 flex flex-col space-y-3 h-[794px]">
              {/* Generated Text Box */}
              <div className="border border-gray-300 rounded-md p-4 bg-white mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">生成テキスト</h3>
                <div className="min-h-[120px] max-h-[200px] overflow-auto">
                  {isGenerating ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
                      <span className="ml-2 text-sm text-gray-500">生成中...</span>
                    </div>
                  ) : generatedText ? (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{generatedText}</p>
                  ) : (
                    <p className="text-sm text-gray-400">生成されたテキストがここに表示されることになります</p>
                  )}
                </div>
              </div>

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
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm text-left hover:bg-gray-50 transition flex items-center justify-between"
            >
              <span>範囲を校正</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </aside>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
      />

      {/* Prompt Input Modal */}
      <PromptInputModal
        isOpen={isPromptInputOpen}
        onClose={() => setIsPromptInputOpen(false)}
        onSave={handleSavePromptText}
        onNext={handleGenerateText}
      />

      {/* Dictionary Input Modal */}
      <DictionaryInputModal
        isOpen={isDictionaryInputOpen}
        onClose={() => setIsDictionaryInputOpen(false)}
        onSave={handleSaveDictionaryText}
        onNext={handleAddDictionaryItem}
      />
    </div>
  )
}

export default DashboardPage
