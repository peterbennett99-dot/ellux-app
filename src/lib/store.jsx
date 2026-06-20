import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AppContext = createContext(null);

const SEL_KEYS = {
  voice: 'ellux_selected_voice',
  agent: 'ellux_selected_agent',
  avatar: 'ellux_selected_avatar',
};

function loadSelection(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
}

// If we're returning from the Salesforce SSO redirect (an OAuth `code` in the
// URL while a PKCE flow is in progress), land back on Settings so the
// Salesforce widget can complete the token exchange.
function initialPage() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('code') && sessionStorage.getItem('sf_oauth_state')) return 'settings';
  return 'dashboard';
}

export function AppProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [activePage, setActivePage] = useState(initialPage);
  const [theme, setThemeState] = useState(() => localStorage.getItem('ellux_theme') || 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('ellux_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState(t => t === 'dark' ? 'light' : 'dark');
  }, []);

  const [selectedVoice, setSelectedVoiceState] = useState(() => loadSelection(SEL_KEYS.voice));
  const [selectedAgent, setSelectedAgentState] = useState(() => loadSelection(SEL_KEYS.agent));
  const [selectedAvatar, setSelectedAvatarState] = useState(() => loadSelection(SEL_KEYS.avatar));

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Toggle selection: selecting the already-selected item clears it.
  const setSelectedVoice = useCallback((voice) => {
    setSelectedVoiceState(prev => {
      const next = prev?.id === voice?.id ? null : voice;
      if (next) localStorage.setItem(SEL_KEYS.voice, JSON.stringify(next));
      else localStorage.removeItem(SEL_KEYS.voice);
      return next;
    });
  }, []);

  const setSelectedAgent = useCallback((agent) => {
    setSelectedAgentState(prev => {
      const next = prev?.id === agent?.id ? null : agent;
      if (next) localStorage.setItem(SEL_KEYS.agent, JSON.stringify(next));
      else localStorage.removeItem(SEL_KEYS.agent);
      return next;
    });
  }, []);

  const setSelectedAvatar = useCallback((avatar) => {
    setSelectedAvatarState(prev => {
      const next = prev?.id === avatar?.id ? null : avatar;
      if (next) localStorage.setItem(SEL_KEYS.avatar, JSON.stringify(next));
      else localStorage.removeItem(SEL_KEYS.avatar);
      return next;
    });
  }, []);

  return (
    <AppContext.Provider value={{
      toast, showToast, activePage, setActivePage,
      theme, toggleTheme,
      selectedVoice, setSelectedVoice,
      selectedAgent, setSelectedAgent,
      selectedAvatar, setSelectedAvatar,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
