import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { pathToTitle } from '../router';

export interface BrowserTab {
  id: string;
  path: string;
  title: string;
}

type NavigationGuard = (targetPath: string) => boolean | Promise<boolean>;

interface TabsContextValue {
  tabs: BrowserTab[];
  activeTabId: string | null;
  openTab: (path: string, title?: string) => Promise<boolean>;
  closeTab: (id: string) => Promise<boolean>;
  selectTab: (id: string) => Promise<boolean>;
  navigateInActiveTab: (path: string, options?: { replace?: boolean; state?: unknown }) => void;
  setNavigationGuard: (guard: NavigationGuard | null) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function newTabId(): string {
  return Math.random().toString(36).slice(2, 9);
}

function getLocationTabId(state: unknown): string | null {
  return state && typeof state === 'object' && 'tabId' in state && typeof state.tabId === 'string'
    ? state.tabId
    : null;
}

function withTabState(state: unknown, tabId: string): Record<string, unknown> {
  return {
    ...(state && typeof state === 'object' ? state : {}),
    tabId,
  };
}

export function TabsProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
  const guardRef = useRef<NavigationGuard | null>(null);

  const [tabs, setTabs] = useState<BrowserTab[]>(() => [
    { id: newTabId(), path: location.pathname, title: pathToTitle(location.pathname) },
  ]);
  const [activeTabId, setActiveTabId] = useState<string | null>(tabs[0].id);

  const setNavigationGuard = useCallback((guard: NavigationGuard | null) => {
    guardRef.current = guard;
  }, []);

  const canLeaveCurrentPath = useCallback(async (targetPath: string) => {
    if (location.pathname === targetPath) return true;
    return guardRef.current ? await guardRef.current(targetPath) : true;
  }, [location.pathname]);

  const navigateToTab = useCallback((path: string, tabId: string, replace = false) => {
    navigate(path, { replace, state: withTabState(location.state, tabId) });
  }, [navigate, location.state]);

  const navigateInActiveTab = useCallback((path: string, options: { replace?: boolean; state?: unknown } = {}) => {
    if (!activeTabId) {
      navigate(path, options);
      return;
    }

    navigate(path, {
      ...options,
      state: withTabState(options.state, activeTabId),
    });
  }, [activeTabId, navigate]);

  useEffect(() => {
    setTabs((prev) => {
      let nextActiveTabId = activeTabId;
      let idx = -1;
      const locationTabId = getLocationTabId(location.state);

      if (locationTabId) {
        idx = prev.findIndex((t) => t.id === locationTabId);
        if (idx >= 0) nextActiveTabId = locationTabId;
      } else if (navigationType === 'POP') {
        const matchingTab = prev.find((t) => t.path === location.pathname);
        if (matchingTab) nextActiveTabId = matchingTab.id;
        idx = nextActiveTabId ? prev.findIndex((t) => t.id === nextActiveTabId) : -1;
      } else {
        idx = activeTabId ? prev.findIndex((t) => t.id === activeTabId) : -1;
      }

      if (nextActiveTabId !== activeTabId) setActiveTabId(nextActiveTabId);
      if (idx < 0) return prev;

      const current = prev[idx];
      const nextTitle = pathToTitle(location.pathname);
      if (current.path === location.pathname && current.title === nextTitle) return prev;

      const next = [...prev];
      next[idx] = { ...current, path: location.pathname, title: nextTitle };
      return next;
    });
  }, [activeTabId, location.pathname, location.state, navigationType]);

  const openTab = useCallback(async (path: string, title?: string) => {
    const id = newTabId();
    setTabs((prev) => [...prev, { id, path, title: title ?? pathToTitle(path) }]);
    setActiveTabId(id);
    navigateToTab(path, id, location.pathname === path);
    return true;
  }, [location.pathname, navigateToTab]);

  const selectTab = useCallback(async (id: string) => {
    const tab = tabs.find((t) => t.id === id);
    if (!tab) return false;
    if (tab.id === activeTabId) return true;

    setActiveTabId(id);
    navigateToTab(tab.path, id, location.pathname === tab.path);
    return true;
  }, [activeTabId, location.pathname, navigateToTab, tabs]);

  const closeTab = useCallback(async (id: string) => {
    const idx = tabs.findIndex((t) => t.id === id);
    if (idx < 0) return false;

    const next = tabs.filter((t) => t.id !== id);
    const isClosingActiveTab = id === activeTabId;
    const fallback: BrowserTab = { id: newTabId(), path: '/', title: pathToTitle('/') };
    const nextActiveTab = next.length === 0 ? fallback : next[Math.min(idx, next.length - 1)];

    if (isClosingActiveTab && !(await canLeaveCurrentPath(nextActiveTab.path))) return false;

    setTabs((prev) => {
      const currentIdx = prev.findIndex((t) => t.id === id);
      if (currentIdx < 0) return prev;
      const currentNext = prev.filter((t) => t.id !== id);
      if (currentNext.length === 0) return [fallback];
      return currentNext;
    });

    if (isClosingActiveTab) {
      setActiveTabId(nextActiveTab.id);
      navigateToTab(nextActiveTab.path, nextActiveTab.id, location.pathname === nextActiveTab.path);
    }

    return true;
  }, [activeTabId, canLeaveCurrentPath, location.pathname, navigateToTab, tabs]);

  return (
    <TabsContext.Provider
      value={{ tabs, activeTabId, openTab, closeTab, selectTab, navigateInActiveTab, setNavigationGuard }}
    >
      {children}
    </TabsContext.Provider>
  );
}

export function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('useTabs must be used inside TabsProvider');
  return ctx;
}
