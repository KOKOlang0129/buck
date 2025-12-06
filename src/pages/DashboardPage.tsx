import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/components/providers/MockAuthProvider'
import { Button } from '@/components/ui/Button'
import { SettingsModal, SettingsData } from '@/components/SettingsModal'
import { PromptInputModal } from '@/components/PromptInputModal'
import { DictionaryInputModal } from '@/components/DictionaryInputModal'
import { mockDataService, Scenario } from '@/services/mockDataService'
import { Plus, Settings, LogOut, Search, ChevronRight, X, Minus, Download } from 'lucide-react'
import { renderMarkdownToHtml, MARKDOWN_TEST_SNIPPET, applyDictionaryHighlights, stripMarkdownToPlainText } from '@/utils/markdown'
import { parseOutlineSections, reorderSectionsInMarkdown } from '@/utils/outline'
import { ProjectTextRelation, AIPolicy, DictionaryEntry } from '@/types'
import JSZip from 'jszip'

const VIEW_MODES = ['outline', 'plain', 'preview', 'markdown'] as const
const PREVIEW_LAYOUTS = ['edit', 'split', 'preview'] as const
type PreviewLayout = (typeof PREVIEW_LAYOUTS)[number]

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
  const [previewLayout, setPreviewLayout] = React.useState<PreviewLayout>('edit')
  const lastMarkdownLayoutRef = React.useRef<PreviewLayout>('edit')
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
  const [dictionaryItems, setDictionaryItems] = React.useState<DictionaryEntry[]>([])
  const [editingDictionaryEntry, setEditingDictionaryEntry] = React.useState<DictionaryEntry | null>(null)
  const [showProofreadMode, setShowProofreadMode] = React.useState(false)
  const [customPanels, setCustomPanels] = React.useState<Array<{ id: string; title: string; content: string }>>([
    { id: 'summary', title: 'あらすじ', content: '' },
    { id: 'note', title: 'Note', content: '' },
    { id: 'vocabulary', title: '単語帳', content: '' },
    { id: 'memo', title: 'メモ', content: '' }
  ])
  const [expandedChapters, setExpandedChapters] = React.useState<Set<string>>(new Set())
  const [draggingSectionId, setDraggingSectionId] = React.useState<string | null>(null)
  const [dragOverSectionId, setDragOverSectionId] = React.useState<string | null>(null)

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
      setDictionaryItems(selectedScenario.dictionaryEntries ?? [])
    } else {
      setEditorContent('')
      setProjectName('')
      setDictionaryItems([])
    }
  }, [selectedScenario])

  React.useEffect(() => {
    if (viewMode === 'preview' && previewLayout !== 'preview') {
      setPreviewLayout('preview')
    } else if (viewMode === 'markdown' && previewLayout !== lastMarkdownLayoutRef.current) {
      setPreviewLayout(lastMarkdownLayoutRef.current)
    }
  }, [viewMode, previewLayout])

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

  const buildProjectExportJson = async (scenario: Scenario): Promise<{ project: ProjectTextRelation; files: Record<string, string> }> => {
    // プロジェクト構造を取得
    const project = mockDataService.getProject(scenario.id)
    if (!project) {
      // プロジェクトが存在しない場合は、Scenarioから構築
      const mainFileName = `${scenario.title || 'project'}.md`
      const mainFilePath = `texts/${mainFileName}`

      const defaultPolicy: AIPolicy = {
        read: 'allow',
        quote: 'internal',
        write: 'deny',
        scope: ['local'],
        until: null
      }

      const projectData: ProjectTextRelation = {
        id: `proj-${scenario.id}`,
        name: scenario.title || '無題プロジェクト',
        main: mainFileName,
        ai_policy: defaultPolicy,
        texts: [
          {
            id: 't-main',
            path: mainFilePath,
            tags: scenario.tags || []
          }
        ],
        tags: Array.from(new Set(scenario.tags || [])),
        tag_docs: {},
        libraly: scenario.dictionaryEntries && scenario.dictionaryEntries.length > 0 ? ['辞書'] : undefined,
        lib_docs:
          scenario.dictionaryEntries && scenario.dictionaryEntries.length > 0
            ? {
                辞書: { path: 'tags/辞書.md' }
              }
            : undefined
      }

      const files: Record<string, string> = {
        [mainFilePath]: editorContent
      }

      if (scenario.dictionaryEntries && scenario.dictionaryEntries.length > 0) {
        const dictMarkdown = scenario.dictionaryEntries
          .map((entry) => `### ${entry.term}\n${entry.description}`)
          .join('\n\n')
        files['tags/辞書.md'] = dictMarkdown
      }

      return { project: projectData, files }
    }

    // プロジェクト構造から直接エクスポート
    const files: Record<string, string> = {}

    // すべてのテキストファイルを取得
    for (const text of project.texts) {
      const content = mockDataService.getProjectTextContent(project.id, text.id)
      if (content) {
        files[text.path] = content
      }
    }

    // タグドキュメントを取得
    for (const [tagName, tagDoc] of Object.entries(project.tag_docs || {})) {
      // タグドキュメントの内容は現時点では空（将来的に実装）
      if (tagDoc.path && !files[tagDoc.path]) {
        files[tagDoc.path] = `# ${tagName}\n\nタグ「${tagName}」の説明`
      }
    }

    // ライブラリドキュメントを取得
    if (project.lib_docs) {
      for (const [libName, libDoc] of Object.entries(project.lib_docs)) {
        if (libDoc.path && !files[libDoc.path]) {
          // 辞書の場合
          if (libName === '辞書') {
            const dictionary = mockDataService.getProjectDictionary(project.id)
            if (dictionary.length > 0) {
              const dictMarkdown = dictionary
                .map((entry) => `### ${entry.term}\n${entry.description}`)
                .join('\n\n')
              files[libDoc.path] = dictMarkdown
            } else {
              files[libDoc.path] = `# 辞書\n\nプロジェクト「${project.name}」の辞書`
            }
          } else {
            files[libDoc.path] = `# ${libName}\n\nライブラリ「${libName}」の内容`
          }
        }
      }
    }

    return { project, files }
  }

  const handleExportProject = async () => {
    if (!selectedScenario) {
      alert('エクスポートするプロジェクトを選択してください。')
      return
    }

    try {
      const { project, files } = await buildProjectExportJson(selectedScenario)
      
      // ZIPファイルを作成
      const zip = new JSZip()
      
      // プロジェクトJSONを追加
      zip.file('project.json', JSON.stringify(project, null, 2))
      
      // すべてのテキストファイルを追加
      for (const [filePath, content] of Object.entries(files)) {
        zip.file(filePath, content)
      }
      
      // ZIPファイルを生成してダウンロード
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      const safeTitle = selectedScenario.title || 'project'
      link.href = url
      link.download = `${safeTitle}-export.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      alert('プロジェクトのエクスポートが完了しました。')
    } catch (error) {
      console.error('Export error:', error)
      alert('プロジェクトのエクスポートに失敗しました。')
    }
  }

  const handleContentChange = (newContent: string) => {
    setEditorContent(newContent)
    if (selectedScenario && user) {
      mockDataService.updateScenario(selectedScenario.id, {
        content: newContent
      })
    }
  }

  const handlePreviewLayoutSelect = (layout: PreviewLayout) => {
    if (viewMode === 'markdown') {
      lastMarkdownLayoutRef.current = layout
      setPreviewLayout(layout)
      return
    }

    if (viewMode === 'preview') {
      if (layout === 'preview') {
        setPreviewLayout('preview')
      } else {
        lastMarkdownLayoutRef.current = layout
        setViewMode('markdown')
        setPreviewLayout(layout)
      }
      return
    }

    setViewMode('markdown')
    lastMarkdownLayoutRef.current = layout
    setPreviewLayout(layout)
  }

  const handleInjectMarkdownSample = () => {
    handleContentChange(MARKDOWN_TEST_SNIPPET)
    setViewMode('markdown')
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
    if (!showDictionaryManager) {
      setShowDictionaryManager(true)
    }
    setEditingDictionaryEntry(null)
    setIsDictionaryInputOpen(true)
  }

  const handleAddDictionaryItem = ({ term, description }: { term: string; description: string }) => {
    if (!selectedScenario) return
    const entry = mockDataService.addDictionaryEntry(selectedScenario.id, { term, description })
    if (entry) {
      setDictionaryItems(prev => [...prev, entry])
      setShowDictionaryManager(true)
      loadScenarios()
      setEditingDictionaryEntry(null)
    }
  }

  const handleRemoveDictionaryEntry = (entryId: string) => {
    if (!selectedScenario) return
    mockDataService.removeDictionaryEntry(selectedScenario.id, entryId)
    setDictionaryItems(prev => prev.filter(entry => entry.id !== entryId))
    loadScenarios()
  }

  const handleDictionaryModalSave = ({ term, description }: { term: string; description: string }) => {
    if (!selectedScenario) return

    if (editingDictionaryEntry) {
      const updated = mockDataService.updateDictionaryEntry(selectedScenario.id, editingDictionaryEntry.id, {
        term,
        description
      })
      if (updated) {
        setDictionaryItems(prev => prev.map(item => (item.id === updated.id ? updated : item)))
        setEditingDictionaryEntry(null)
        setShowDictionaryManager(true)
        loadScenarios()
      }
      return
    }

    handleAddDictionaryItem({ term, description })
  }

  const handleEditDictionaryEntry = (entry: DictionaryEntry) => {
    setEditingDictionaryEntry(entry)
    setIsDictionaryInputOpen(true)
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

  const handleUpdatePanelTitle = (id: string, newTitle: string) => {
    setCustomPanels(customPanels.map(panel => 
      panel.id === id ? { ...panel, title: newTitle } : panel
    ))
  }

  const handleRemovePanel = (id: string) => {
    setCustomPanels(customPanels.filter(panel => panel.id !== id))
  }

  const outlineSections = React.useMemo(() => parseOutlineSections(editorContent), [editorContent])
  const renderedMarkdown = React.useMemo(
    () => renderMarkdownToHtml(editorContent || DEFAULT_PREVIEW_CONTENT),
    [editorContent]
  )
  const dictionaryHighlightedMarkdown = React.useMemo(
    () => applyDictionaryHighlights(renderedMarkdown, dictionaryItems),
    [renderedMarkdown, dictionaryItems]
  )
  const toggleChapter = (id: string) => {
    const newExpanded = new Set(expandedChapters)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedChapters(newExpanded)
  }

  const handleReorderSection = (sourceId: string, targetId: string) => {
    if (!sourceId || !targetId || sourceId === targetId) return
    const updated = reorderSectionsInMarkdown(editorContent, sourceId, targetId)
    if (updated !== editorContent) {
      handleContentChange(updated)
    }
  }

  if (isLoadingScenarios) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-500" />
          <p className="text-sm font-semibold text-slate-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="h-full w-full flex flex-col px-6 py-5">
        {/* Header */}
        <div className="mb-5 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 max-w-md">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 tracking-wide uppercase">
                プロジェクトの名前
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => handleProjectNameChange(e.target.value)}
                placeholder="プロジェクト名を入力"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200"
              />
            </div>
            <div className="flex items-center space-x-2.5">
              <Button 
                variant="outline" 
                className="px-5 py-2.5 bg-white/80 backdrop-blur-sm border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-white hover:shadow-md hover:border-slate-300 transition-all duration-200" 
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                設定
              </Button>
              <Button 
                variant="outline" 
                className="px-5 py-2.5 bg-white/80 backdrop-blur-sm border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-white hover:shadow-md hover:border-slate-300 transition-all duration-200" 
                onClick={handleExportProject}
              >
                <Download className="h-4 w-4 mr-2" />
                エクスポート
              </Button>
              <Button 
                variant="outline" 
                className="px-5 py-2.5 bg-white/80 backdrop-blur-sm border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-white hover:shadow-md hover:border-slate-300 transition-all duration-200" 
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                ログアウト
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 gap-5 xl:grid-cols-[clamp(240px,18vw,280px)_minmax(0,1fr)_clamp(260px,21vw,380px)] min-h-0">
          {/* Project List */}
          <aside className="bg-white/90 backdrop-blur-md border border-slate-200/60 rounded-2xl p-5 flex flex-col shadow-lg shadow-slate-200/50 min-h-0">
            <h2 className="text-xs font-bold text-slate-600 mb-4 tracking-wider uppercase">プロジェクト一覧</h2>
            <div className="space-y-2 flex-1 overflow-y-auto scrollable pr-1 min-h-0">
              {scenarios.length === 0 ? (
                <p className="text-sm text-slate-400 italic py-8 text-center">まだプロジェクトがありません</p>
              ) : (
                scenarios.map((scenario) => (
                  <button
                    key={scenario.id}
                    onClick={() => setSelectedScenarioId(scenario.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                      selectedScenarioId === scenario.id
                        ? 'border-blue-500 bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
                        : 'border-slate-200 bg-white/60 hover:bg-white hover:border-slate-300 hover:shadow-md text-slate-700'
                    }`}
                  >
                    <p className="text-sm font-semibold truncate">{scenario.title}</p>
                  </button>
                ))
              )}
            </div>
            <Button
              variant="outline"
              onClick={handleCreateScenario}
              className="mt-4 w-full justify-center py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 rounded-xl font-semibold shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 hover:scale-[1.02] transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              新規作成
            </Button>
          </aside>

          {/* Main Editor */}
          <section className="bg-white/90 backdrop-blur-md border border-slate-200/60 rounded-2xl p-5 flex flex-col shadow-lg shadow-slate-200/50 min-h-0">
            <div className="flex items-center flex-wrap gap-3 mb-4 flex-shrink-0">
              <span className="text-xs font-bold text-slate-600 tracking-wider uppercase">ViewMode</span>
              <div className="flex flex-wrap gap-2">
                {VIEW_MODES.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold capitalize transition-all duration-200 ${
                      viewMode === mode
                        ? (mode === 'plain' || mode === 'outline' || mode === 'preview' || mode === 'markdown')
                          ? 'border-emerald-500 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30 scale-105'
                          : 'border-slate-800 bg-slate-800 text-white shadow-md'
                        : 'border-slate-200 bg-white/80 text-slate-600 hover:bg-white hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              {(viewMode === 'markdown' || viewMode === 'preview') && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">表示</span>
                  <div className="inline-flex rounded-xl border-2 border-slate-200 overflow-hidden bg-white/80">
                    {PREVIEW_LAYOUTS.map((layout) => (
                      <button
                        key={layout}
                        type="button"
                        onClick={() => handlePreviewLayoutSelect(layout)}
                        className={`px-3 py-1.5 text-xs font-semibold capitalize transition-all duration-200 ${
                          previewLayout === layout
                            ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-inner'
                            : 'bg-transparent text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {layout === 'edit' ? '編集' : layout === 'split' ? '分割' : 'プレビュー'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={handleInjectMarkdownSample}
                className="text-xs font-semibold border-2 border-dashed border-slate-300 rounded-xl px-3 py-1.5 text-slate-500 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
              >
                Markdownテスト挿入
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)] gap-4 flex-1 min-h-0">
              {(viewMode === 'outline' || viewMode === 'plain' || viewMode === 'preview' || viewMode === 'markdown' || viewMode === null) && (
                <div className="border-2 border-slate-200/60 rounded-xl p-4 bg-gradient-to-br from-slate-50/80 to-blue-50/30 overflow-y-auto scrollable min-h-0">
                  <h3 className="text-xs font-bold text-slate-600 mb-3 tracking-wider uppercase">Outline</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    {outlineSections.length > 0 ? (
                      outlineSections.map((item) => {
                        const isExpanded = expandedChapters.has(item.id)
                        return (
                          <div
                            key={item.id}
                            className={`flex items-center gap-1 group ${
                              dragOverSectionId === item.id ? 'bg-blue-50 rounded' : ''
                            }`}
                          >
                            <div
                              className={`flex-1 flex items-center gap-2 cursor-move hover:bg-white/60 px-3 py-2 rounded-lg transition-all duration-200 ${
                                item.level <= 1 ? 'pl-0' : item.level === 2 ? 'pl-6' : 'pl-12'
                              } ${dragOverSectionId === item.id ? 'bg-blue-100/50 border-2 border-blue-300' : ''}`}
                              draggable
                              onDragStart={(e) => {
                                setDraggingSectionId(item.id)
                                e.dataTransfer.effectAllowed = 'move'
                              }}
                              onDragOver={(e) => {
                                e.preventDefault()
                                e.dataTransfer.dropEffect = 'move'
                                if (draggingSectionId && draggingSectionId !== item.id) {
                                  setDragOverSectionId(item.id)
                                }
                              }}
                              onDrop={(e) => {
                                e.preventDefault()
                                if (draggingSectionId && draggingSectionId !== item.id) {
                                  handleReorderSection(draggingSectionId, item.id)
                                }
                                setDragOverSectionId(null)
                                setDraggingSectionId(null)
                              }}
                              onDragEnd={() => {
                                setDragOverSectionId(null)
                                setDraggingSectionId(null)
                              }}
                              onDragLeave={() => {
                                if (dragOverSectionId === item.id) {
                                  setDragOverSectionId(null)
                                }
                              }}
                              onClick={() => {
                                // ドラッグ中でない場合のみトグル
                                if (!draggingSectionId) {
                                  toggleChapter(item.id)
                                }
                              }}
                            >
                              <span className="text-sm font-medium text-slate-700">{item.text}</span>
                              {isExpanded && (
                                <span className="text-xs text-slate-400 ml-1">▼</span>
                              )}
                              {!isExpanded && (
                                <span className="text-xs text-slate-400 ml-1">▶</span>
                              )}
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-gray-400">アウトラインはまだありません。</p>
                    )}
                  </div>
                </div>
              )}
              <div className={`border-2 border-slate-200/60 rounded-xl p-5 overflow-y-auto scrollable bg-white/80 backdrop-blur-sm min-h-0 ${(viewMode === 'outline' || viewMode === 'plain' || viewMode === 'preview' || viewMode === 'markdown' || viewMode === null) ? '' : 'md:col-span-2'}`}>
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
                      {outlineSections.length > 0 ? (
                        <div className="flex-1 space-y-3">
                          {outlineSections.map((item, index) => {
                            return (
                              <div
                                key={`outline-main-${item.id}-${index}`}
                                className={`flex flex-col border-2 rounded-xl p-4 hover:border-slate-300 hover:shadow-md transition-all duration-200 cursor-move bg-white/80 backdrop-blur-sm ${
                                  dragOverSectionId === item.id ? 'border-blue-400 bg-blue-50/80 shadow-lg shadow-blue-400/20 scale-[1.02]' : 'border-slate-200'
                                }`}
                                draggable
                                onDragStart={() => setDraggingSectionId(item.id)}
                                onDragOver={(e) => {
                                  e.preventDefault()
                                  if (draggingSectionId && draggingSectionId !== item.id) {
                                    setDragOverSectionId(item.id)
                                  }
                                }}
                                onDrop={(e) => {
                                  e.preventDefault()
                                  if (draggingSectionId && draggingSectionId !== item.id) {
                                    handleReorderSection(draggingSectionId, item.id)
                                  }
                                  setDragOverSectionId(null)
                                  setDraggingSectionId(null)
                                }}
                                onDragEnd={() => {
                                  setDragOverSectionId(null)
                                  setDraggingSectionId(null)
                                }}
                                onDragLeave={() => {
                                  if (dragOverSectionId === item.id) {
                                    setDragOverSectionId(null)
                                  }
                                }}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                                      {index + 1}章
                                    </span>
                                    <span className="font-semibold text-slate-800">{item.text}</span>
                                  </div>
                                </div>
                                <p className="text-xs text-slate-400 mt-2 font-medium">
                                  レベル: {item.level} / 開始行 {item.startLine + 1}
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-sm text-slate-400 italic">
                          アウトラインはまだありません
                        </div>
                      )}
                      <div className="mt-6 pt-4 border-t-2 border-slate-200/60 text-xs text-slate-500 space-y-1 bg-slate-50/50 rounded-lg p-3">
                        <p className="font-semibold">いわゆるアウトラインエディタモード</p>
                        <p>本文は折りたたまれている</p>
                        <p>header要素をドラッグ・アンド・ドロップできる</p>
                      </div>
                    </div>
                  ) : viewMode === 'plain' ? (
                    <div className="h-full flex flex-col min-h-0">
                      <div className="w-full flex-1 text-sm leading-relaxed text-slate-700 font-sans whitespace-pre-wrap overflow-y-auto scrollable border-none outline-none">
                        {stripMarkdownToPlainText(editorContent) || (
                          <span className="text-slate-400 italic">ここにプレーンテキストで内容が表示されます...</span>
                        )}
                      </div>
                      <div className="mt-4 pt-4 border-t-2 border-slate-200 text-xs text-slate-500 space-y-1 bg-slate-50/50 rounded-lg p-3">
                        <p className="font-semibold">プレーンテキストモード</p>
                        <p>markdownのレンダリングが使用されない</p>
                        <p>読み・書き下ろしのためのモード</p>
                        <p className="text-slate-400 mt-2">※ 編集はMarkdownモードで行ってください</p>
                      </div>
                    </div>
                  ) : viewMode === 'preview' ? (
                  <div className="h-full min-h-0 overflow-y-auto scrollable">
                      <div
                        className="markdown-preview"
                        dangerouslySetInnerHTML={{ __html: dictionaryHighlightedMarkdown }}
                      />
                      <div className="mt-6 pt-4 border-t-2 border-slate-200 text-xs text-slate-500 space-y-1 bg-slate-50/50 rounded-lg p-3">
                        <p>このツールでは表現できないが、強調表示やリストなど</p>
                        <p>markdownのレンダリング表示モード</p>
                        <p>リンクや辞書などをハイライト表示</p>
                      </div>
                    </div>
                  ) : viewMode === 'markdown' ? (
                    <div className="h-full flex flex-col min-h-0">
                      {previewLayout === 'split' ? (
                        <div className="grid md:grid-cols-2 gap-4 flex-1 min-h-0">
                          <textarea
                            value={editorContent}
                            onChange={(e) => handleContentChange(e.target.value)}
                            className="w-full h-full text-sm leading-relaxed text-slate-700 font-mono resize-none border-2 border-slate-200 rounded-xl p-4 bg-white/90 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 scrollable"
                            placeholder="ここにMarkdown形式で内容を入力してください..."
                          />
                          <div className="border-2 border-slate-200 rounded-xl p-4 overflow-y-auto scrollable bg-white/90">
                            <div
                              className="markdown-preview"
                              dangerouslySetInnerHTML={{ __html: dictionaryHighlightedMarkdown }}
                            />
                          </div>
                        </div>
                      ) : previewLayout === 'preview' ? (
                        <div className="flex-1 border-2 border-slate-200 rounded-xl p-4 overflow-y-auto scrollable bg-white/90 min-h-0">
                          <div
                            className="markdown-preview"
                            dangerouslySetInnerHTML={{ __html: dictionaryHighlightedMarkdown }}
                          />
                        </div>
                      ) : (
                        <textarea
                          value={editorContent}
                          onChange={(e) => handleContentChange(e.target.value)}
                          className="w-full flex-1 text-sm leading-relaxed text-slate-700 font-mono resize-none border-none outline-none bg-transparent scrollable"
                          placeholder="ここにMarkdown形式で内容を入力してください..."
                        />
                      )}
                      <div className="mt-4 pt-4 border-t-2 border-slate-200 text-xs text-center text-slate-500 bg-slate-50/50 rounded-lg p-3">
                        <p className="font-semibold">markdown 編集モード</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700 font-mono">
                      {editorContent}
                    </div>
                  )
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-sm text-slate-400 italic">プロジェクトを選択すると内容が表示されます</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Action Panel / Tag Manager / Dictionary Manager / Proofread Mode */}
          {showProofreadMode ? (
            <aside className="bg-white/90 backdrop-blur-md border border-slate-200/60 rounded-2xl p-5 flex flex-col space-y-3 shadow-lg shadow-slate-200/50 min-h-0">
              <div className="flex items-center justify-between border-b-2 border-slate-200/60 pb-3 mb-3">
                <h3 className="text-xs font-bold text-slate-700 tracking-wider uppercase">校正モード</h3>
                <button
                  onClick={() => setShowProofreadMode(false)}
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1 transition-all duration-200"
                  aria-label="校正モードを閉じる"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {/* Custom Panels */}
              <div className="flex-1 overflow-y-auto scrollable space-y-3 min-h-0">
                {customPanels.map((panel) => (
                  <div key={panel.id} className="border-2 border-slate-200/60 rounded-xl bg-gradient-to-br from-white/90 to-slate-50/50 shadow-md">
                    <div className="flex items-center justify-between px-4 py-3 border-b-2 border-slate-200/60 bg-slate-50/50 rounded-t-xl">
                      <input
                        type="text"
                        value={panel.title}
                        onChange={(e) => handleUpdatePanelTitle(panel.id, e.target.value)}
                        className="text-xs font-bold text-slate-700 bg-transparent border-none outline-none focus:bg-white px-2 py-1 rounded-lg tracking-wider uppercase"
                        onBlur={(e) => {
                          if (!e.target.value.trim()) {
                            handleUpdatePanelTitle(panel.id, '新しいパネル')
                          }
                        }}
                      />
                      <button
                        onClick={() => handleRemovePanel(panel.id)}
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg p-1 transition-all duration-200"
                        aria-label="閉じる"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="px-4 py-3 min-h-[80px]">
                      <textarea
                        value={panel.content}
                        onChange={(e) => {
                          setCustomPanels(customPanels.map(p => 
                            p.id === panel.id ? { ...p, content: e.target.value } : p
                          ))
                        }}
                        className="w-full text-sm text-slate-700 border-none outline-none resize-none bg-transparent placeholder-slate-400"
                        placeholder="内容を入力..."
                        rows={3}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-2 gap-2.5 mt-auto pt-4 border-t-2 border-slate-200/60">
                <button 
                  onClick={handleAddArticle}
                  className="border-2 border-slate-200 bg-white/80 rounded-xl px-3 py-2.5 text-sm font-semibold text-left text-slate-700 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200"
                >
                  ＋ 文章の追加
                </button>
                <button 
                  onClick={handleAddDictionary}
                  className="border-2 border-slate-200 bg-white/80 rounded-xl px-3 py-2.5 text-sm font-semibold text-left text-slate-700 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200"
                >
                  ＋ 辞書の追加
                </button>
                <button 
                  onClick={handleAddTag}
                  className="border-2 border-slate-200 bg-white/80 rounded-xl px-3 py-2.5 text-sm font-semibold text-left text-slate-700 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200"
                >
                  ＋ タグの追加
                </button>
                <button 
                  onClick={handleProofreadRange}
                  className="border-2 border-slate-200 bg-white/80 rounded-xl px-3 py-2.5 text-sm font-semibold text-left text-slate-700 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200 flex items-center justify-between"
                >
                  <span>範囲を校正</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </aside>
          ) : showDictionaryManager ? (
            <aside className="bg-white/90 backdrop-blur-md border border-slate-200/60 rounded-2xl p-5 flex flex-col space-y-3 shadow-lg shadow-slate-200/50 min-h-0 overflow-y-auto scrollable">
              {/* あらすじ Window */}
              <div className="border-2 border-slate-200/60 rounded-xl bg-gradient-to-br from-white/90 to-slate-50/50 shadow-md">
                <div className="flex items-center justify-between px-4 py-3 border-b-2 border-slate-200/60 bg-slate-50/50 rounded-t-xl">
                  <h3 className="text-xs font-bold text-slate-700 tracking-wider uppercase">あらすじ</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCloseDictionaryManager}
                      className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1 transition-all duration-200"
                      aria-label="最小化"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCloseDictionaryManager}
                      className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1 transition-all duration-200"
                      aria-label="閉じる"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="px-4 py-3 min-h-[80px]">
                  <textarea
                    className="w-full text-sm text-slate-700 border-none outline-none resize-none bg-transparent placeholder-slate-400"
                    placeholder="あらすじを入力..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Note Window */}
              <div className="border-2 border-slate-200/60 rounded-xl bg-gradient-to-br from-white/90 to-slate-50/50 shadow-md">
                <div className="flex items-center justify-between px-4 py-3 border-b-2 border-slate-200/60 bg-slate-50/50 rounded-t-xl">
                  <h3 className="text-xs font-bold text-slate-700 tracking-wider uppercase">Note</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCloseDictionaryManager}
                      className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1 transition-all duration-200"
                      aria-label="最小化"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCloseDictionaryManager}
                      className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1 transition-all duration-200"
                      aria-label="閉じる"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="px-4 py-3 min-h-[80px]">
                  <textarea
                    className="w-full text-sm text-slate-700 border-none outline-none resize-none bg-transparent placeholder-slate-400"
                    placeholder="ノートを入力..."
                    rows={3}
                  />
                </div>
              </div>

              {/* タグ Window */}
              <div className="border-2 border-slate-200/60 rounded-xl bg-gradient-to-br from-white/90 to-slate-50/50 shadow-md">
                <div className="flex items-center justify-between px-4 py-3 border-b-2 border-slate-200/60 bg-slate-50/50 rounded-t-xl">
                  <h3 className="text-xs font-bold text-slate-700 tracking-wider uppercase">タグ</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCloseDictionaryManager}
                      className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1 transition-all duration-200"
                      aria-label="最小化"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCloseDictionaryManager}
                      className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1 transition-all duration-200"
                      aria-label="閉じる"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="px-4 py-3 flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-slate-600">タグ</span>
                  <button className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 rounded-lg text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200">
                    Main
                  </button>
                  <button className="px-3 py-1.5 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg text-sm font-semibold text-slate-600 transition-all duration-200">
                    +説明を追加
                  </button>
                </div>
              </div>

              {/* 辞書 Windows */}
              {dictionaryItems.map((item) => (
                <div key={item.id} className="border-2 border-slate-200/60 rounded-xl bg-gradient-to-br from-white/90 to-blue-50/30 shadow-md">
                  <div className="flex items-center justify-between px-4 py-3 border-b-2 border-slate-200/60 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 rounded-t-xl">
                    <h3 className="text-sm font-bold text-slate-800">{item.term}</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditDictionaryEntry(item)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-lg transition-all duration-200"
                        aria-label="辞書エントリを編集"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleRemoveDictionaryEntry(item.id)}
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg p-1 transition-all duration-200"
                        aria-label="辞書エントリを削除"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{item.description}</p>
                    <p className="text-xs text-slate-400 mt-3 font-medium">
                      登録日: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}
                    </p>
                  </div>
                </div>
              ))}

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-2 gap-2.5 mt-auto pt-4 border-t-2 border-slate-200/60">
                <button 
                  onClick={handleAddArticle}
                  className="border-2 border-slate-200 bg-white/80 rounded-xl px-3 py-2.5 text-sm font-semibold text-left text-slate-700 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200"
                >
                  ＋ 文章の追加
                </button>
                <button 
                  onClick={handleAddDictionary}
                  className="border-2 border-slate-200 bg-white/80 rounded-xl px-3 py-2.5 text-sm font-semibold text-left text-slate-700 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200"
                >
                  ＋ 辞書の追加
                </button>
                <button 
                  onClick={handleAddTag}
                  className="border-2 border-slate-200 bg-white/80 rounded-xl px-3 py-2.5 text-sm font-semibold text-left text-slate-700 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200"
                >
                  ＋ タグの追加
                </button>
                <button 
                  onClick={handleProofreadRange}
                  className="border-2 border-slate-200 bg-white/80 rounded-xl px-3 py-2.5 text-sm font-semibold text-left text-slate-700 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200 flex items-center justify-between"
                >
                  <span>範囲を校正</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </aside>
          ) : showTagManager ? (
            <aside className="bg-white/90 backdrop-blur-md border border-slate-200/60 rounded-2xl p-5 flex flex-col space-y-3 shadow-lg shadow-slate-200/50 min-h-0 overflow-y-auto scrollable">
              {/* Tag Window */}
              <div className="border-2 border-slate-200/60 rounded-xl bg-gradient-to-br from-white/90 to-slate-50/50 shadow-md mb-4">
                <div className="flex items-center justify-between px-4 py-3 border-b-2 border-slate-200/60 bg-slate-50/50 rounded-t-xl">
                  <h3 className="text-xs font-bold text-slate-700 tracking-wider uppercase">タグ</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCloseTagManager}
                      className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1 transition-all duration-200"
                      aria-label="最小化"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCloseTagManager}
                      className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1 transition-all duration-200"
                      aria-label="閉じる"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <p className="text-sm font-semibold text-slate-700">main</p>
                </div>
              </div>

              {/* Preview Area */}
              <div className="flex-1 border-2 border-slate-200/60 rounded-xl bg-gradient-to-br from-white/90 to-slate-50/50 p-4 mb-4 overflow-y-auto scrollable shadow-md min-h-0">
                <p className="text-xs text-slate-500 mb-3 font-semibold">追加されたファイルのプレビューが出る</p>
                <div className="min-h-[200px]">
                  {tagPreview ? (
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono bg-slate-50/50 p-3 rounded-lg">{tagPreview}</pre>
                  ) : (
                    <p className="text-sm text-slate-400 italic">プレビューがここに表示されます</p>
                  )}
                </div>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-4 border-t-2 border-slate-200/60">
                <button 
                  onClick={handleAddArticle}
                  className="border-2 border-slate-200 bg-white/80 rounded-xl px-3 py-2.5 text-sm font-semibold text-left text-slate-700 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200"
                >
                  ＋ 文章の追加
                </button>
                <button 
                  onClick={handleAddDictionary}
                  className="border-2 border-slate-200 bg-white/80 rounded-xl px-3 py-2.5 text-sm font-semibold text-left text-slate-700 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200"
                >
                  ＋ 辞書の追加
                </button>
                <button 
                  onClick={handleAddNewTag}
                  className="border-2 border-slate-200 bg-white/80 rounded-xl px-3 py-2.5 text-sm font-semibold text-left text-slate-700 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200"
                >
                  ＋ タグの追加
                </button>
                <button 
                  onClick={handleProofreadRange}
                  className="border-2 border-slate-200 bg-white/80 rounded-xl px-3 py-2.5 text-sm font-semibold text-left text-slate-700 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200 flex items-center justify-between"
                >
                  <span>範囲を校正</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </aside>
          ) : (
          <aside className="bg-white/90 backdrop-blur-md border border-slate-200/60 rounded-2xl p-5 flex flex-col space-y-3 shadow-lg shadow-slate-200/50 min-h-0">
              {/* Generated Text Box */}
              <div className="border-2 border-slate-200/60 rounded-xl p-4 bg-gradient-to-br from-slate-50/80 to-blue-50/30 mb-2 shadow-sm">
                <h3 className="text-xs font-bold text-slate-600 mb-2 tracking-wider uppercase">生成テキスト</h3>
                <div className="min-h-[120px] max-h-[200px] overflow-y-auto scrollable">
                  {isGenerating ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-blue-500"></div>
                      <span className="ml-2 text-sm text-slate-500 font-medium">生成中...</span>
                    </div>
                  ) : generatedText ? (
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{generatedText}</p>
                  ) : (
                    <p className="text-sm text-slate-400 italic">生成されたテキストがここに表示されることになります</p>
                  )}
                </div>
              </div>

            <button 
              onClick={handleAddArticle}
              className="w-full border-2 border-slate-200 bg-white/80 rounded-xl px-4 py-3 text-sm font-semibold text-left text-slate-700 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200"
            >
              ＋ 文章の追加
            </button>
            <button 
              onClick={handleAddTag}
              className="w-full border-2 border-slate-200 bg-white/80 rounded-xl px-4 py-3 text-sm font-semibold text-left text-slate-700 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200"
            >
              ＋ タグの追加
            </button>
            <button 
              onClick={handleAddDictionary}
              className="w-full border-2 border-slate-200 bg-white/80 rounded-xl px-4 py-3 text-sm font-semibold text-left text-slate-700 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200"
            >
              ＋ 辞書の追加
            </button>
            <button 
              onClick={handleSearchMaterials}
              className="w-full border-2 border-slate-200 bg-white/80 rounded-xl px-4 py-3 text-sm font-semibold text-left text-slate-700 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200 flex items-center"
            >
              <Search className="h-4 w-4 mr-2" /> 資料の検索
            </button>
            <button 
              onClick={handleProofreadRange}
                className="w-full border-2 border-slate-200 bg-white/80 rounded-xl px-4 py-3 text-sm font-semibold text-left text-slate-700 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200 flex items-center justify-between"
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
        onClose={() => {
          setIsDictionaryInputOpen(false)
          setEditingDictionaryEntry(null)
        }}
        onSave={handleDictionaryModalSave}
        onNext={editingDictionaryEntry ? undefined : handleAddDictionaryItem}
        mode={editingDictionaryEntry ? 'edit' : 'create'}
        initialEntry={
          editingDictionaryEntry
            ? { term: editingDictionaryEntry.term, description: editingDictionaryEntry.description }
            : undefined
        }
      />
    </div>
  )
}

export default DashboardPage
