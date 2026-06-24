export type PageTab = {
  path: string;
  title: string;
};

export type PageRouteMap = Record<string, PageTab>;

type PersistedPageTab = {
  path?: string;
};

export function buildPageRouteMap(routers: API.RouterItem[]): PageRouteMap {
  return routers.reduce<PageRouteMap>((acc, router) => {
    if (router.path && router.component && router.component !== 'Layout') {
      acc[router.path] = {
        path: router.path,
        title: router.meta?.title || router.name || router.path,
      };
    }

    if (router.children?.length) {
      Object.assign(acc, buildPageRouteMap(router.children));
    }

    return acc;
  }, {});
}

export function restorePageTabs(
  savedTabs: PersistedPageTab[],
  routeMap: PageRouteMap,
  currentPath: string,
): PageTab[] {
  const nextTabs: PageTab[] = [];

  savedTabs.forEach((tab) => {
    const path = tab.path;
    if (!path || !routeMap[path] || nextTabs.some((item) => item.path === path)) {
      return;
    }
    nextTabs.push(routeMap[path]);
  });

  return addPageTab(nextTabs, currentPath, routeMap);
}

export function addPageTab(
  tabs: PageTab[],
  currentPath: string,
  routeMap: PageRouteMap,
): PageTab[] {
  const currentTab = routeMap[currentPath];
  if (!currentTab) {
    return tabs
      .filter((tab) => routeMap[tab.path])
      .map((tab) => routeMap[tab.path]);
  }

  const nextTabs = tabs
    .filter((tab) => routeMap[tab.path])
    .map((tab) => routeMap[tab.path]);

  if (nextTabs.some((tab) => tab.path === currentPath)) {
    return nextTabs;
  }

  return [...nextTabs, currentTab];
}

export function closePageTab(
  tabs: PageTab[],
  targetPath: string,
  activePath: string,
): { tabs: PageTab[]; nextActivePath: string } {
  if (tabs.length <= 1) {
    return { tabs, nextActivePath: activePath };
  }

  const targetIndex = tabs.findIndex((tab) => tab.path === targetPath);
  if (targetIndex === -1) {
    return { tabs, nextActivePath: activePath };
  }

  const nextTabs = tabs.filter((tab) => tab.path !== targetPath);
  if (targetPath !== activePath) {
    return { tabs: nextTabs, nextActivePath: activePath };
  }

  const fallbackTab = nextTabs[targetIndex - 1] || nextTabs[0];
  return {
    tabs: nextTabs,
    nextActivePath: fallbackTab.path,
  };
}
