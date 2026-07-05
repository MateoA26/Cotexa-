import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '../types'
interface AuthContextType {
  user: User | null
  login: (token: string, user: User) => void
  logout: () => void
  updateUser: (data: Partial<User>) => void
  isAuthenticated: boolean
}
const AuthContext = createContext<AuthContextType>({} as AuthContextType)
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) setUser(JSON.parse(savedUser))
  }, [])
  const login = (token: string, user: User) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
  }
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }
  const updateUser = (data: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev
      const updated = { ...prev, ...data }
      localStorage.setItem('user', JSON.stringify(updated))
      return updated
    })
  }
  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}
export const useAuth = () => useContext(AuthContext)
