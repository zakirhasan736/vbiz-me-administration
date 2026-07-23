'use client'

import { auth, googleProvider } from '@/lib/firebase'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { Lock, Mail, UserCircle } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React, { createContext, useContext, useState, useSyncExternalStore } from 'react'

/** Minimal user shape used across the app (Firebase User or demo login). */
export type AuthUser = Pick<User, 'uid' | 'email' | 'displayName' | 'emailVerified' | 'photoURL'>

type AuthContextValue = { user: AuthUser | null; loading: boolean }
type AuthSnapshot = { user: AuthUser | null; loading: boolean }

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const AUTH_LOADING_SNAPSHOT: AuthSnapshot = { user: null, loading: true }

const DEMO_USER: AuthUser = {
  uid: 'demo-user',
  email: 'demo@example.com',
  displayName: 'Demo User',
  emailVerified: true,
  photoURL: null,
}

let authSnapshot: AuthSnapshot = AUTH_LOADING_SNAPSHOT
const authListeners = new Set<() => void>()
let firebaseUnsubscribe: (() => void) | null = null
let authChangeHandler: (() => void) | null = null

function emitAuthChange() {
  authListeners.forEach((listener) => listener())
}

function getAuthSnapshot(): AuthSnapshot {
  return authSnapshot
}

function getServerAuthSnapshot(): AuthSnapshot {
  return AUTH_LOADING_SNAPSHOT
}

function isAuthUser(value: unknown): value is AuthUser {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return typeof record.uid === 'string' && typeof record.emailVerified === 'boolean'
}

function readMockUser(): AuthUser | null {
  if (typeof window === 'undefined') return null

  const mockUserStr = localStorage.getItem('vbiz_mock_user')
  if (!mockUserStr) return null

  try {
    const parsed: unknown = JSON.parse(mockUserStr)
    if (!isAuthUser(parsed)) {
      localStorage.removeItem('vbiz_mock_user')
      return null
    }
    return {
      uid: parsed.uid,
      email: typeof parsed.email === 'string' ? parsed.email : null,
      displayName: typeof parsed.displayName === 'string' ? parsed.displayName : null,
      emailVerified: parsed.emailVerified,
      photoURL: typeof parsed.photoURL === 'string' ? parsed.photoURL : null,
    }
  } catch {
    localStorage.removeItem('vbiz_mock_user')
    return null
  }
}

function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerified,
    photoURL: user.photoURL,
  }
}

function startFirebaseListener() {
  if (firebaseUnsubscribe) return

  firebaseUnsubscribe = onAuthStateChanged(auth, (currentUser) => {
    authSnapshot = {
      user: currentUser ? toAuthUser(currentUser) : null,
      loading: false,
    }
    emitAuthChange()
  })
}

function stopFirebaseListener() {
  firebaseUnsubscribe?.()
  firebaseUnsubscribe = null
}

function syncAuthFromStorage() {
  const mockUser = readMockUser()
  if (mockUser) {
    stopFirebaseListener()
    authSnapshot = { user: mockUser, loading: false }
    emitAuthChange()
    return
  }

  startFirebaseListener()
}

function subscribeToAuth(onStoreChange: () => void) {
  authListeners.add(onStoreChange)

  if (authListeners.size === 1 && typeof window !== 'undefined') {
    authChangeHandler = () => syncAuthFromStorage()
    window.addEventListener('auth-change', authChangeHandler)
    syncAuthFromStorage()
  }

  return () => {
    authListeners.delete(onStoreChange)

    if (authListeners.size === 0) {
      if (authChangeHandler && typeof window !== 'undefined') {
        window.removeEventListener('auth-change', authChangeHandler)
        authChangeHandler = null
      }
      stopFirebaseListener()
      authSnapshot = AUTH_LOADING_SNAPSHOT
    }
  }
}

export function notifyAuthChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth-change'))
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authState = useSyncExternalStore(subscribeToAuth, getAuthSnapshot, getServerAuthSnapshot)

  return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>
}

export function Login() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleBypassLogin = () => {
    localStorage.setItem('vbiz_mock_user', JSON.stringify(DEMO_USER))
    notifyAuthChange()
    router.push('/')
  }

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to sign in with Google. Try Demo Login if Firebase is not set up.'))
      console.error(err)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
    } catch (err: unknown) {
      setError(
        getErrorMessage(err, `Failed to ${isSignUp ? 'Sign Up' : 'Log In'}. Try Demo Login if Firebase is not set up.`)
      )
      console.error(err)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 text-slate-900 dark:bg-[#09090b] dark:text-white">
      <div className="relative w-full max-w-sm overflow-hidden rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#070a13]">
        <div className="bg-primary-600/20 pointer-events-none absolute top-0 left-1/2 h-[100px] w-[200px] -translate-x-1/2 rounded-full blur-[50px]" />

        <div className="from-primary-600 to-primary-800 shadow-primary-500/20 relative z-10 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br text-3xl font-bold text-white shadow-sm">
          v
        </div>

        <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
          {isSignUp ? 'Create an Account' : 'Welcome back'}
        </h2>
        <p className="mb-8 text-[13px] font-medium text-slate-500 dark:text-slate-400">
          {isSignUp ? 'Sign up to start building your vCards.' : 'Please sign in to continue building your vCards.'}
        </p>

        {error ? (
          <div className="mb-6 rounded-[14px] border border-red-500/20 bg-red-500/10 p-3 text-left text-[12px] text-red-400">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleEmailAuth} className="relative z-10 mb-6 space-y-4">
          <div className="group relative flex flex-col space-y-1.5 text-left">
            <Mail className="group-focus-within:text-primary-600 absolute top-[38px] left-4 h-4 w-4 text-slate-400 transition-colors dark:text-slate-500" />
            <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-[14px] border border-slate-200 bg-slate-50 py-3.5 pr-4 pl-11 text-[13px] font-medium text-slate-900 shadow-sm transition-all outline-none focus:ring-1 dark:border-white/10 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="group relative flex flex-col space-y-1.5 text-left">
            <Lock className="group-focus-within:text-primary-600 absolute top-[38px] left-4 h-4 w-4 text-slate-400 transition-colors dark:text-slate-500" />
            <label className="pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase transition-colors group-focus-within:text-slate-500 dark:text-slate-400">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-[14px] border border-slate-200 bg-slate-50 py-3.5 pr-4 pl-11 text-[13px] font-medium text-slate-900 shadow-sm transition-all outline-none focus:ring-1 dark:border-white/10 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <button
            type="submit"
            className="bg-primary-600 hover:bg-primary-700 mt-2 w-full rounded-[16px] py-4 text-[14px] font-semibold text-white shadow-sm transition-all active:scale-95"
          >
            {isSignUp ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        <div className="relative mb-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-white/10" />
          </div>
          <span className="relative bg-white px-3 text-[11px] font-bold tracking-widest text-slate-500 uppercase dark:bg-[#070a13] dark:text-slate-400">
            Or
          </span>
        </div>

        <div className="relative z-10 space-y-3">
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="flex w-full items-center justify-center gap-3 rounded-[16px] border border-slate-200 bg-slate-50 py-3.5 text-[14px] font-semibold text-slate-900 shadow-sm transition-all hover:bg-slate-100 active:scale-95 dark:border-white/10 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
          >
            <Image
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="h-4 w-4 object-cover"
              width={16}
              height={16}
            />
            Continue with Google
          </button>

          <button
            onClick={handleBypassLogin}
            type="button"
            className="border-primary-200 bg-primary-50 text-primary-600 hover:bg-primary-100 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-400 dark:hover:bg-primary-500/20 flex w-full items-center justify-center gap-3 rounded-[16px] border py-3.5 text-[14px] font-semibold transition-all active:scale-95"
          >
            <UserCircle className="h-4 w-4" />
            Demo Login (Skip Firebase)
          </button>
        </div>

        <div className="mt-6 border-t border-slate-200 pt-6 dark:border-white/10">
          <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-semibold transition-colors outline-none"
            >
              {isSignUp ? 'Log In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export async function logout(): Promise<void> {
  localStorage.removeItem('vbiz_mock_user')
  notifyAuthChange()
  await signOut(auth)
}
