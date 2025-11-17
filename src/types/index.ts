import { User } from 'firebase/auth'

export interface Scenario {
  id: string
  title: string
  content: string
  author: string
  authorId: string
  createdAt: Date
  updatedAt: Date
  tags: string[]
  isPublic: boolean
  aiSuggestions?: string[]
}

export interface UserProfile {
  id: string
  email: string
  displayName: string
  photoURL?: string
  createdAt: Date
  isAllowed: boolean
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
}

export interface EditorContextType {
  content: string
  setContent: (content: string) => void
  aiCompletion: (prompt: string) => Promise<string>
  saveScenario: (scenario: Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  loading: boolean
}

/**
 * AIポリシーの読み取り権限
 * - allow: AIが全文参照OK
 * - mask: 参照OKだが出力時は伏字/要約のみ
 * - deny: 参照自体を禁止
 */
export type AIReadPolicy = 'allow' | 'mask' | 'deny'

/**
 * AIポリシーの引用権限
 * - allow: AIが外部へ原文引用して良い
 * - internal: 内部のみ引用可能
 * - deny: 引用禁止
 */
export type AIQuotePolicy = 'allow' | 'internal' | 'deny'

/**
 * AIポリシーの書き込み権限
 * AIがそのノードを編集/生成する可否
 */
export type AIWritePolicy = 'allow' | 'deny'

/**
 * AI実行環境のスコープ
 * - local: ローカルのみ許可
 * - cloud: クラウドも許可
 */
export type AIScope = 'local' | 'cloud'

/**
 * AIポリシー設定
 */
export interface AIPolicy {
  read?: AIReadPolicy
  quote?: AIQuotePolicy
  write?: AIWritePolicy
  scope?: AIScope[]
  until?: string | null // ISO 8601形式の日時文字列（例: "2025-12-31T23:59:59Z"）
}

/**
 * テキストドキュメント
 */
export interface TextDocument {
  id: string
  path: string
  tags: string[]
  ai?: AIPolicy // このテキストに対するAIポリシー（プロジェクト全体のポリシーを上書き）
}

/**
 * タグドキュメント
 */
export interface TagDocument {
  path: string
  ai?: AIPolicy
}

/**
 * ライブラリドキュメント
 */
export interface LibraryDocument {
  path: string
  ai?: AIPolicy
}

/**
 * プロジェクトとテキストの関係を定義するJSON構造
 */
export interface ProjectTextRelation {
  id: string
  name: string
  main: string // メインのMarkdownファイル名（例: "プロジェクト名.md"）
  ai_policy: AIPolicy // プロジェクト全体のAIポリシー
  texts: TextDocument[] // テキストドキュメントの配列
  tags: string[] // プロジェクト全体で利用可能なタグのリスト
  tag_docs: Record<string, TagDocument> // タグごとのドキュメント
  library?: string[] // ライブラリのリスト（例: ["辞書"]）
  lib_docs?: Record<string, LibraryDocument> // ライブラリごとのドキュメント
}

