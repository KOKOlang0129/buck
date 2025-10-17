import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
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
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('mockUser')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const signIn = async (email: string, _password: string) => {
    // Mock authentication - accept any email/password combination
    const mockUser: User = {
      uid: 'mock-user-id',
      email,
      displayName: email.split('@')[0],
      photoURL: null
    }
    
    setUser(mockUser)
    localStorage.setItem('mockUser', JSON.stringify(mockUser))
  }

  const signUp = async (email: string, _password: string, displayName: string) => {
    // Mock registration - accept any email/password combination
    const mockUser: User = {
      uid: 'mock-user-id',
      email,
      displayName,
      photoURL: null
    }
    
    setUser(mockUser)
    localStorage.setItem('mockUser', JSON.stringify(mockUser))
  }

  const signOut = async () => {
    setUser(null)
    localStorage.removeItem('mockUser')
  }

  const signInWithGoogle = async () => {
    // Mock Google sign in
    const mockUser: User = {
      uid: 'mock-google-user-id',
      email: 'user@gmail.com',
      displayName: 'Google User',
      photoURL: 'https://via.placeholder.com/40'
    }
    
    setUser(mockUser)
    localStorage.setItem('mockUser', JSON.stringify(mockUser))
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
