import {
  collectAllowedPaths,
  firstNavigablePath,
  isAllowedRedirect,
} from './routeAccess';

const routers: API.RouterItem[] = [
  {
    path: '/platform',
    component: 'Layout',
    meta: { title: '平台工作台', icon: 'DashboardOutlined' },
    children: [
      {
        path: '/platform/dashboard',
        component: './Platform/Dashboard',
        meta: { title: '数据看板', icon: 'DashboardOutlined' },
      },
    ],
  },
  {
    path: '/system',
    component: 'Layout',
    meta: { title: '系统管理' },
    children: [
      {
        path: '/system/user',
        component: './System/User',
        meta: { title: '用户管理' },
      },
      {
        path: '/system/user/hidden-page',
        component: './System/Hidden',
        hidden: true,
        meta: { title: '隐藏页' },
      },
    ],
  },
];

describe('collectAllowedPaths', () => {
  it('递归收集所有 path', () => {
    const allowed = collectAllowedPaths(routers);
    expect(allowed.has('/platform')).toBe(true);
    expect(allowed.has('/platform/dashboard')).toBe(true);
    expect(allowed.has('/system/user')).toBe(true);
    expect(allowed.size).toBe(5);
  });

  it('空输入返回空集合', () => {
    expect(collectAllowedPaths(undefined).size).toBe(0);
  });
});

describe('firstNavigablePath', () => {
  it('跳过目录（Layout）取第一个真实页面', () => {
    expect(firstNavigablePath(routers)).toBe('/platform/dashboard');
  });

  it('跳过 hidden 页面', () => {
    const onlyHidden: API.RouterItem[] = [
      {
        path: '/x',
        component: 'Layout',
        children: [{ path: '/x/y', component: './Y', hidden: true }],
      },
    ];
    expect(firstNavigablePath(onlyHidden)).toBeUndefined();
  });
});

describe('isAllowedRedirect', () => {
  const allowed = collectAllowedPaths(routers);

  it('集合内的 path 放行（含 query/hash）', () => {
    expect(isAllowedRedirect('/platform/dashboard', allowed)).toBe(true);
    expect(isAllowedRedirect('/system/user?tab=1#top', allowed)).toBe(true);
  });

  it('拒绝绝对 URL 与协议相对地址（开放重定向）', () => {
    expect(isAllowedRedirect('https://evil.com', allowed)).toBe(false);
    expect(isAllowedRedirect('//evil.com', allowed)).toBe(false);
    expect(isAllowedRedirect('', allowed)).toBe(false);
  });

  it('拒绝集合外/无权限的 path', () => {
    expect(isAllowedRedirect('/welcome', allowed)).toBe(false);
    expect(isAllowedRedirect('/shop-workspace/shop-dashboard', allowed)).toBe(
      false,
    );
  });
});
