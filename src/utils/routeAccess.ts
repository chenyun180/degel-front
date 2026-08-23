/**
 * 登录跳转目标计算：基于后端下发的 routers（已是绝对路径）判断
 * redirect 是否有权访问，以及默认落地页（首个可导航菜单）。
 */

/** 递归收集 routers 树上所有可访问 path（后端 buildRouters 已拼为绝对路径） */
export function collectAllowedPaths(routers?: API.RouterItem[]): Set<string> {
  const allowed = new Set<string>();
  const walk = (items?: API.RouterItem[]) => {
    (items || []).forEach((item) => {
      if (item.path) allowed.add(item.path);
      walk(item.children);
    });
  };
  walk(routers);
  return allowed;
}

/** DFS 找第一个可落地页面：未隐藏、有 component 且不是目录 Layout */
export function firstNavigablePath(
  routers?: API.RouterItem[],
): string | undefined {
  for (const item of routers || []) {
    if (
      !item.hidden &&
      item.component &&
      item.component !== 'Layout' &&
      item.path
    ) {
      return item.path;
    }
    const child = firstNavigablePath(item.children);
    if (child) return child;
  }
  return undefined;
}

/**
 * 校验 redirect 目标：
 * 1. 必须以单个 '/' 开头（拒绝绝对 URL 与 '//' 协议相对地址，防开放重定向）
 * 2. 去掉 query/hash 后必须在该用户可访问的菜单 path 集合内
 */
export function isAllowedRedirect(
  redirect: string,
  allowed: Set<string>,
): boolean {
  if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) {
    return false;
  }
  const pathOnly = redirect.split(/[?#]/)[0];
  return allowed.has(pathOnly);
}
