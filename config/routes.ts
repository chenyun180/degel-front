export default [
  {
    path: '/user',
    layout: false,
    routes: [{ name: 'login', path: '/user/login', component: './user/login' }],
  },
  {
    path: '/welcome',
    name: '首页',
    icon: 'smile',
    component: './Welcome',
  },
  {
    path: '/system',
    name: '系统管理',
    icon: 'setting',
    routes: [
      { path: '/system', redirect: '/system/user' },
      { path: '/system/user', name: '用户管理', icon: 'user', component: './System/User' },
      { path: '/system/role', name: '角色管理', icon: 'team', component: './System/Role' },
      { path: '/system/menu', name: '菜单管理', icon: 'menu', component: './System/Menu' },
      { path: '/system/shop', name: '店铺管理', icon: 'shop', component: './System/Shop' },
    ],
  },
  { path: '/', redirect: '/welcome' },
  { component: '404', layout: false, path: './*' },
];
