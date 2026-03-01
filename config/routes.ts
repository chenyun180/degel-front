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
    access: 'canAdmin',
    routes: [
      { path: '/system', redirect: '/system/user' },
      { path: '/system/user', name: '用户管理', icon: 'user', component: './System/User', access: 'canAdmin' },
      { path: '/system/role', name: '角色管理', icon: 'team', component: './System/Role', access: 'canAdmin' },
      { path: '/system/menu', name: '菜单管理', icon: 'menu', component: './System/Menu', access: 'canAdmin' },
      { path: '/system/shop', name: '店铺管理', icon: 'shop', component: './System/Shop', access: 'canAdmin' },
    ],
  },
  {
    path: '/shop-workspace',
    routes: [
      { path: '/shop-workspace/shop-dashboard', component: './Shop/Dashboard' },
      {
        path: '/shop-workspace/shop-product-dir',
        routes: [
          {
            path: '/shop-workspace/shop-product-dir/shop-product-list',
            component: './Shop/Product/List',
          },
          {
            path: '/shop-workspace/shop-product-dir/shop-product-create',
            component: './Shop/Product/Create',
          },
          { path: '/shop-workspace/shop-product-dir/shop-category', component: './Shop/Category' },
        ],
      },
      {
        path: '/shop-workspace/shop-order-dir',
        routes: [
          {
            path: '/shop-workspace/shop-order-dir/shop-order-list',
            component: './Shop/Order/List',
          },
          {
            path: '/shop-workspace/shop-order-dir/shop-order-ship',
            component: './Shop/Order/Ship',
          },
          { path: '/shop-workspace/shop-order-dir/shop-aftersale', component: './Shop/AfterSale' },
        ],
      },
      {
        path: '/shop-workspace/shop-stats-dir',
        routes: [
          {
            path: '/shop-workspace/shop-stats-dir/shop-stats-hot',
            component: './Shop/Stats/Hot',
          },
          {
            path: '/shop-workspace/shop-stats-dir/shop-stats-visitor',
            component: './Shop/Stats/Visitor',
          },
        ],
      },
      {
        path: '/shop-workspace/shop-setting',
        routes: [
          { path: '/shop-workspace/shop-setting/shop-info', component: './Shop/Info' },
          { path: '/shop-workspace/shop-setting/shop-staff', component: './Shop/Staff' },
          { path: '/shop-workspace/shop-setting/shop-role', component: './Shop/Role' },
        ],
      },
    ],
  },
  { path: '/', redirect: '/welcome' },
  { component: '404', layout: false, path: './*' },
];
