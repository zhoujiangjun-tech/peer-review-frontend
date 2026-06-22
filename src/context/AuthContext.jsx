/**
 * context/AuthContext.jsx
 * 全局用户态：token + user 对象
 * - 启动时尝试从 localStorage 恢复
 * - 提供 login / register / logout 方法
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as AntApp } from 'antd';

import {
  authApi,
  getToken, setToken, clearAuth,
  getStoredUser, setStoredUser
} from '../api/index.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { message } = AntApp.useApp();
  const [user, setUser] = useState(getStoredUser());
  const [bootstrapping, setBootstrapping] = useState(true);
  const navigate = useNavigate();

  // 启动时若有 token 但无 user，调用 /me 验证并补全
  useEffect(() => {
    (async () => {
      if (getToken() && !user) {
        try {
          const { user: u } = await authApi.me();
          setUser(u);
          setStoredUser(u);
        } catch {
          clearAuth();
          setUser(null);
        }
      }
      setBootstrapping(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finishAuth = useCallback((payload) => {
    setToken(payload.token);
    setStoredUser(payload.user);
    setUser(payload.user);
  }, []);

  const login = useCallback(async (values) => {
    const data = await authApi.login(values);
    finishAuth(data);
    message.success(`欢迎回来，${data.user.real_name || data.user.username}`);
    navigate(data.user.role === 'teacher' ? '/teacher' : '/student', { replace: true });
    return data.user;
  }, [finishAuth, message, navigate]);

  const register = useCallback(async (values) => {
    const data = await authApi.register(values);
    finishAuth(data);
    message.success('注册成功，已自动登录');
    navigate(data.user.role === 'teacher' ? '/teacher' : '/student', { replace: true });
    return data.user;
  }, [finishAuth, message, navigate]);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    message.info('已退出登录');
    navigate('/login', { replace: true });
  }, [message, navigate]);

  return (
    <AuthContext.Provider value={{ user, bootstrapping, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
