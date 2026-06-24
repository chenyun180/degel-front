import { history } from '@umijs/max';
import { Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import {
  addPageTab,
  buildPageRouteMap,
  closePageTab,
  restorePageTabs,
  type PageTab,
} from '@/utils/pageTabs';

const STORAGE_KEY = 'degel_open_page_tabs';

type PageTabsProps = {
  routers: API.RouterItem[];
  currentPath: string;
};

function readStoredTabs(): PageTab[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const PageTabs: React.FC<PageTabsProps> = ({ routers, currentPath }) => {
  const routeMap = useMemo(() => buildPageRouteMap(routers), [routers]);
  const [tabs, setTabs] = useState<PageTab[]>([]);

  useEffect(() => {
    setTabs((prevTabs) => {
      const baseTabs = prevTabs.length > 0 ? prevTabs : readStoredTabs();
      return restorePageTabs(baseTabs, routeMap, currentPath);
    });
  }, [currentPath, routeMap]);

  useEffect(() => {
    if (Object.keys(routeMap).length === 0 || typeof window === 'undefined') {
      return;
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(tabs.map((tab) => ({ path: tab.path }))),
    );
  }, [routeMap, tabs]);

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 8,
        marginBottom: 16,
        padding: '8px 16px 0',
      }}
    >
      <Tabs
        hideAdd
        type="editable-card"
        activeKey={tabs.some((tab) => tab.path === currentPath) ? currentPath : tabs[0]?.path}
        items={tabs.map((tab) => ({
          key: tab.path,
          label: tab.title,
          closable: tabs.length > 1,
        }))}
        onChange={(nextPath) => {
          if (nextPath !== currentPath) {
            history.push(nextPath);
          }
        }}
        onEdit={(targetKey, action) => {
          if (action !== 'remove' || typeof targetKey !== 'string') {
            return;
          }

          setTabs((prevTabs) => {
            const result = closePageTab(prevTabs, targetKey, currentPath);
            if (result.nextActivePath !== currentPath) {
              history.push(result.nextActivePath);
            }
            return result.tabs;
          });
        }}
      />
    </div>
  );
};

export default PageTabs;
