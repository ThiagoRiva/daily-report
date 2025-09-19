import React, { createContext, useContext, useReducer, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const AuthContext = createContext();

// Tipos de ações
const ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_ERROR: 'LOGIN_ERROR',
  LOGOUT: 'LOGOUT',
  VERIFY_TOKEN: 'VERIFY_TOKEN'
};

// Estado inicial
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  error: null
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.LOGIN_START:
      return {
        ...state,
        loading: true,
        error: null
      };

    case ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null
      };

    case ACTIONS.LOGIN_ERROR:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };

    case ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };

    case ACTIONS.VERIFY_TOKEN:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false
      };

    default:
      return state;
  }
};

// Provider
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verificar token ao carregar a aplicação
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        dispatch({ type: ACTIONS.LOGOUT });
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/verify`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          dispatch({ type: ACTIONS.VERIFY_TOKEN, payload: data.user });
        } else {
          localStorage.removeItem('token');
          dispatch({ type: ACTIONS.LOGOUT });
        }
      } catch (error) {
        console.error('Erro ao verificar token:', error);
        localStorage.removeItem('token');
        dispatch({ type: ACTIONS.LOGOUT });
      }
    };

    verifyToken();
  }, []);

  // Função de login
  const login = async (email, senha) => {
    dispatch({ type: ACTIONS.LOGIN_START });

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, senha })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        dispatch({ 
          type: ACTIONS.LOGIN_SUCCESS, 
          payload: { user: data.user, token: data.token } 
        });
        return { success: true };
      } else {
        dispatch({ type: ACTIONS.LOGIN_ERROR, payload: data.error });
        return { success: false, error: data.error };
      }
    } catch (error) {
      const errorMessage = 'Erro de conexão. Verifique sua internet.';
      dispatch({ type: ACTIONS.LOGIN_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Função de logout
  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: ACTIONS.LOGOUT });
  };

  const value = {
    ...state,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
