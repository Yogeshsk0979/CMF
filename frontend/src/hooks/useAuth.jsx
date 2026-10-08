import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { api } from '../lib/api'

const AuthContext = createContext(null)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const token = localStorage.getItem('cmf_token')
    const refresh = localStorage.getItem('cmf_refresh')
    const savedUser = localStorage.getItem('cmf_user')
    if (token && refresh && savedUser) {
      try {
        const u = JSON.parse(savedUser)
        setUser(u)
        setProfile(u.profile || null)
      } catch (e) {}
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      loadProfile()
    } else {
      localStorage.removeItem('cmf_token')
      localStorage.removeItem('cmf_refresh')
      localStorage.removeItem('cmf_user')
      delete api.defaults.headers.common['Authorization']
      setUser(null)
      setProfile(null)
      setLoading(false)
    }
  }, [])

  async function loadProfile() {
    try {
      const res = await api.get('/auth/me')
      const userData = { ...res.data.user, profile: res.data.profile }
      setUser(userData)
      setProfile(res.data.profile)
      localStorage.setItem('cmf_user', JSON.stringify(userData))
    } catch (err) {
      if (err.response?.status === 401) {
        try {
          await refreshToken()
          const res = await api.get('/auth/me')
          const userData = { ...res.data.user, profile: res.data.profile }
          setUser(userData)
          setProfile(res.data.profile)
          localStorage.setItem('cmf_user', JSON.stringify(userData))
        } catch (e) {
          logout()
        }
      }
    } finally {
      setLoading(false)
    }
  }

  async function login(identifier, password) {
    const res = await api.post('/auth/login', { identifier, password })
    const { token, refreshToken, user: u } = res.data
    localStorage.setItem('cmf_token', token)
    localStorage.setItem('cmf_refresh', refreshToken)
    localStorage.setItem('cmf_user', JSON.stringify(u))
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(u)
    return u
  }

  async function logout() {
    localStorage.removeItem('cmf_token')
    localStorage.removeItem('cmf_refresh')
    localStorage.removeItem('cmf_user')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    setProfile(null)
    navigate('/login')
  }

  async function refreshToken() {
    const refresh = localStorage.getItem('cmf_refresh')
    if (!refresh) throw new Error('No refresh token')
    const res = await api.post('/auth/refresh', { refreshToken: refresh })
    localStorage.setItem('cmf_token', res.data.token)
    api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
    return res.data.token
  }

  function hasRole(...roles) {
    if (!user) return false
    return roles.includes(user.role)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, refreshToken, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}