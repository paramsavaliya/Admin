import { createContext, useEffect, useState } from "react";
import { ReactNode } from "react";

import { useNavigate,useLocation } from "react-router-dom";

import axios from "axios";

import authConfig from '../Config/auth'

import {AuthValuesType, RegisterParams, LoginParams, ErrCallbackType, UserDataType} from './Types'

const defaultProvider: AuthValuesType = {
  user: null,
  loading: true,
  setUser: () => null,
  setLoading: () => Boolean,
  isInitialized: false,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  setIsInitialized: () => Boolean,
  register: () => Promise.resolve()
}

const AuthCotext = createContext(defaultProvider)

type Props = {
  children: ReactNode
}

const AuthProvider = ({ children }: Props) => {
  // ** States
  const [user, setUser] = useState<UserDataType | null>(defaultProvider.user)
  const [loading, setLoading] = useState<boolean>(defaultProvider.loading)
  const [isInitialized, setIsInitialized] = useState<boolean>(defaultProvider.isInitialized)

  // ** Hooks
//   const router = useRoutes([{path:''}])
const navigate = useNavigate();
const location = useLocation();

  useEffect(() => {
    const initAuth = async (): Promise<void> => {
      setIsInitialized(true)
      const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)!
      if (storedToken) {
        setLoading(true)
        await axios
          .get(authConfig.meEndpoint, {
            headers: {
              Authorization: storedToken
            }
          })
          .then(async response => {
            setLoading(false)
            setUser({ ...response.data.userData })
          })
      } else {
        setLoading(false)
      }
    }
    initAuth()
  }, [])

  const handleLogin = (params: LoginParams, errorCallback?: ErrCallbackType) => {
    axios
      .post(authConfig.loginEndpoint, params)
      .then(async res => {
        window.localStorage.setItem(authConfig.storageTokenKeyName, res.data.accessToken)
      })
      .then(() => {
        axios
          .get(authConfig.meEndpoint, {
            headers: {
              Authorization: window.localStorage.getItem(authConfig.storageTokenKeyName)!
            }
          })
          .then(async response => {
             const returnUrl = location.pathname

            setUser({ ...response.data.userData })
            await window.localStorage.setItem('userData', JSON.stringify(response.data.userData))

            const redirectURL = returnUrl && returnUrl !== '/' ? returnUrl : '/'

            navigate(redirectURL as string)
          })
      })
      .catch(err => {
        if (errorCallback) errorCallback(err)
      })
  }

  const handleLogout = () => {
    setUser(null)
    setIsInitialized(false)
    window.localStorage.removeItem('userData')
    window.localStorage.removeItem(authConfig.storageTokenKeyName)
    navigate('/login')
  }

  const handleRegister = (params: RegisterParams, errorCallback?: ErrCallbackType) => {
    axios
      .post(authConfig.registerEndpoint, params)
      .then(res => {
        if (res.data.error) {
          if (errorCallback) errorCallback(res.data.error)
        } else {
          handleLogin({ email: params.email, password: params.password })
        }
      })
      .catch((err: { [key: string]: string }) => (errorCallback ? errorCallback(err) : null))
  }

  const values = {
    user,
    loading,
    setUser,
    setLoading,
    isInitialized,
    setIsInitialized,
    login: handleLogin,
    logout: handleLogout,
    register: handleRegister
  }

  return <AuthCotext.Provider value={values}>{children}</AuthCotext.Provider>
}

export { AuthCotext, AuthProvider }