import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '@/api/supabaseClient';

const AuthContext = createContext(null);
const toAppUser = (user) => user && ({ ...user, role: user.app_metadata?.role || user.user_metadata?.role || 'user' });

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  const checkUserAuth = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setUser(null);
      setAuthError({ type: 'configuration', message: 'Supabase is not configured.' });
      setIsLoadingAuth(false);
      return;
    }
    setIsLoadingAuth(true);
    const { data, error } = await supabase.auth.getUser();
    setUser(toAppUser(data?.user));
    setAuthError(error ? { type: 'auth_required', message: error.message } : null);
    setIsLoadingAuth(false);
  }, []);

  useEffect(() => {
    checkUserAuth();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toAppUser(session?.user || null));
      setAuthError(null);
      setIsLoadingAuth(false);
    });
    return () => listener.subscription.unsubscribe();
  }, [checkUserAuth]);

  const logout = useCallback(async (shouldRedirect = true) => {
    await supabase.auth.signOut();
    setUser(null);
    if (shouldRedirect) window.location.assign('/login');
  }, []);

  const navigateToLogin = useCallback(() => {
    if (window.location.pathname !== '/login') {
      const returnTo = window.location.pathname + window.location.search;
      window.location.assign(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
  }, []);

  return <AuthContext.Provider value={{
    user, isAuthenticated: Boolean(user), isLoadingAuth,
    isLoadingPublicSettings: false, authError, appPublicSettings: null,
    authChecked: !isLoadingAuth, logout, navigateToLogin,
    checkUserAuth, checkAppState: checkUserAuth,
  }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
