import { createContext, useContext, useState } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

function readStoredOwner() {
  try {
    const stored = localStorage.getItem('owner')
    if (!stored) return null

    const parsed = JSON.parse(stored)
    if (parsed && typeof parsed === 'object') return parsed
  } catch {}

  localStorage.removeItem('owner')
  localStorage.removeItem('token')
  localStorage.removeItem('active_location')
  return null
}

export function AuthProvider({ children }) {
  const [owner, setOwner] = useState(readStoredOwner)
  const [loading, setLoading] = useState(false)

  /** Step 1: validate input, send OTP to email + phone.
   *  Returns { message, otp?, dev_mode? } — does NOT log the user in. */
  const signupRequest = async (email, password, restaurantName, phone = '') => {
    const res = await authApi.signupRequest({
      email,
      password,
      restaurant_name: restaurantName,
      phone,
    })
    return res.data
  }

  /** Step 2: verify OTP, create account, issue JWT.
   *  Sets token + owner in localStorage and context state. */
  const signupVerify = async (email, otpCode) => {
    const res = await authApi.signupVerify({ email, otp_code: otpCode })
    localStorage.setItem('token', res.data.access_token)
    localStorage.setItem('owner', JSON.stringify(res.data.owner))
    setOwner(res.data.owner)
    return res.data
  }

  /** Step 1 of login: validate credentials, send OTP.
   *  In dev / when SMTP not configured the backend returns a JWT directly. */
  const loginRequest = async (email, password) => {
    const res = await authApi.loginRequest({ email, password })
    if (res.data.access_token) {
      localStorage.setItem('token', res.data.access_token)
      localStorage.setItem('owner', JSON.stringify(res.data.owner))
      setOwner(res.data.owner)
    }
    return res.data // { message, otp?, dev_mode? } OR { access_token, owner }
  }

  /** Step 2 of login: verify OTP, issue JWT. */
  const login = async (email, otp_code) => {
    const res = await authApi.loginVerify({ email, otp_code })
    localStorage.setItem('token', res.data.access_token)
    localStorage.setItem('owner', JSON.stringify(res.data.owner))
    setOwner(res.data.owner)
    return res.data
  }

  const logout = () => {
    authApi.logout().catch(() => {})
    localStorage.removeItem('token')
    localStorage.removeItem('owner')
    setOwner(null)
  }

  return (
    <AuthContext.Provider
      value={{ owner, setOwner, signupRequest, signupVerify, loginRequest, login, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
