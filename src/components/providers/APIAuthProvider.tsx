/**
 * API統合認証プロバイダー
 * バックエンドAPIと連携した認証機能
 */

import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '@/lib/api'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  isAllowed?: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // ローカルストレージからユーザー情報を復元
    const savedUser = localStorage.getItem('user')
    const token = localStorage.getItem('jwt-token')
    
    if (savedUser && token) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
      } catch (error) {
        console.error('Error parsing saved user:', error)
        localStorage.removeItem('user')
        localStorage.removeItem('jwt-token')
      }
    }
    
    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      // まずFirebase Authで認証
      const firebaseUser = await signInWithEmailAndPassword(auth, email, password)
      
      // バックエンドAPIでログイン（JWT取得）
      const response = await authAPI.login(email, password)
      
      // ユーザー情報を設定
      const userData: User = {
        uid: firebaseUser.user.uid,
        email: firebaseUser.user.email,
        displayName: response.user?.displayName || firebaseUser.user.displayName,
        photoURL: response.user?.photoURL || firebaseUser.user.photoURL,
        isAllowed: response.user?.isAllowed || false
      }
      
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
    } catch (error: any) {
      console.error('Sign in error:', error)
      throw new Error(error.message || 'ログインに失敗しました')
    }
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      // Firebase Authでユーザー作成
      const firebaseUser = await createUserWithEmailAndPassword(auth, email, password)
      
      // ユーザー情報を設定（ホワイトリスト承認待ち）
      const userData: User = {
        uid: firebaseUser.user.uid,
        email: firebaseUser.user.email,
        displayName,
        photoURL: firebaseUser.user.photoURL,
        isAllowed: false // 管理者の承認が必要
      }
      
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      
      // 注意: 新規登録時はJWTトークンは取得できない（ホワイトリスト未承認のため）
    } catch (error: any) {
      console.error('Sign up error:', error)
      throw new Error(error.message || '登録に失敗しました')
    }
  }

  const signOut = async () => {
    try {
      // Firebase Authからログアウト
      await auth.signOut()
      
      // ローカルストレージをクリア
      authAPI.logout()
      setUser(null)
    } catch (error: any) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  const signInWithGoogle = async () => {
    // TODO: Google認証の実装
    throw new Error('Google認証は現在実装されていません')
  }

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

