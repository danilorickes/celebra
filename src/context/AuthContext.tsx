import React, { createContext, useContext, useEffect, useState } from 'react'
import type { AuthModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'

interface AuthContextType {
  user: AuthModel | null
  token: string | null
  isLoading: boolean
  login: (email: string, pass: string) => Promise<void>
  signup: (name: string, email: string, pass: string) => Promise<void>
  logout: () => void
  requestPasswordReset: (email: string) => Promise<void>
  confirmPasswordReset: (token: string, password: string, passwordConfirm: string) => Promise<void>
  confirmVerification: (token: string) => Promise<void>
  requestEmailChange: (newEmail: string) => Promise<void>
  confirmEmailChange: (token: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthModel | null>(pb.authStore.record)
  const [token, setToken] = useState<string | null>(pb.authStore.token)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initial check
    setUser(pb.authStore.record)
    setToken(pb.authStore.token)
    setIsLoading(false)

    // Listen to changes
    const unsub = pb.authStore.onChange((token, record) => {
      setToken(token)
      setUser(record)
    })

    return () => {
      unsub()
    }
  }, [])

  const login = async (email: string, pass: string) => {
    await pb.collection('users').authWithPassword(email, pass)
    setUser(pb.authStore.record)
    setToken(pb.authStore.token)
  }

  const signup = async (name: string, email: string, pass: string) => {
    await pb.collection('users').create({
      name,
      email,
      password: pass,
      passwordConfirm: pass,
    })
    // Send verification email
    try {
      await pb.collection('users').requestVerification(email)
    } catch (_) {
      // ignore
    }
    // Auto login
    await login(email, pass)
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
    setToken(null)
  }

  const requestPasswordReset = async (email: string) => {
    await pb.collection('users').requestPasswordReset(email)
  }

  const confirmPasswordReset = async (token: string, password: string, passwordConfirm: string) => {
    await pb.collection('users').confirmPasswordReset(token, password, passwordConfirm)
  }

  const confirmVerification = async (token: string) => {
    await pb.collection('users').confirmVerification(token)
  }

  const requestEmailChange = async (newEmail: string) => {
    await pb.collection('users').requestEmailChange(newEmail)
  }

  const confirmEmailChange = async (token: string, password: string) => {
    await pb.collection('users').confirmEmailChange(token, password)
    logout()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        signup,
        logout,
        requestPasswordReset,
        confirmPasswordReset,
        confirmVerification,
        requestEmailChange,
        confirmEmailChange,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return ctx
}
