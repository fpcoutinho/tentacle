export type AuthProvider = 'dev' | 'firebase'

export type AuthUser = {
  id: string
  provider: AuthProvider
  email?: string
}