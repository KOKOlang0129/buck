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

