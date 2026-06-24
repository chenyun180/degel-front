import {
  addPageTab,
  buildPageRouteMap,
  closePageTab,
  restorePageTabs,
} from './pageTabs';

const routers: API.RouterItem[] = [
  {
    path: '/shop-workspace',
    component: 'Layout',
    meta: { title: '店铺工作台', icon: 'HomeOutlined' },
    children: [
      {
        path: '/shop-workspace/shop-dashboard',
        component: './Shop/Dashboard',
        meta: { title: '工作台' },
      },
      {
        path: '/shop-workspace/shop-product-dir',
        component: 'Layout',
        meta: { title: '商品管理', icon: 'ShoppingOutlined' },
        children: [
          {
            path: '/shop-workspace/shop-product-dir/shop-product-list',
            component: './Shop/Product/List',
            meta: { title: '商品列表' },
          },
          {
            path: '/shop-workspace/shop-product-dir/shop-category',
            component: './Shop/Category',
            meta: { title: '商品分类' },
          },
        ],
      },
    ],
  },
];

describe('pageTabs helpers', () => {
  it('builds a map for page routes only', () => {
    const routeMap = buildPageRouteMap(routers);

    expect(routeMap).toEqual({
      '/shop-workspace/shop-dashboard': { path: '/shop-workspace/shop-dashboard', title: '工作台' },
      '/shop-workspace/shop-product-dir/shop-product-list': {
        path: '/shop-workspace/shop-product-dir/shop-product-list',
        title: '商品列表',
      },
      '/shop-workspace/shop-product-dir/shop-category': {
        path: '/shop-workspace/shop-product-dir/shop-category',
        title: '商品分类',
      },
    });
  });

  it('restores only known tabs and keeps current route present', () => {
    const routeMap = buildPageRouteMap(routers);

    const tabs = restorePageTabs(
      [
        { path: '/shop-workspace/shop-product-dir/shop-category' },
        { path: '/missing-route' },
      ],
      routeMap,
      '/shop-workspace/shop-dashboard',
    );

    expect(tabs).toEqual([
      { path: '/shop-workspace/shop-product-dir/shop-category', title: '商品分类' },
      { path: '/shop-workspace/shop-dashboard', title: '工作台' },
    ]);
  });

  it('adds the current page once', () => {
    const routeMap = buildPageRouteMap(routers);
    const tabs = [{ path: '/shop-workspace/shop-dashboard', title: '工作台' }];

    expect(
      addPageTab(tabs, '/shop-workspace/shop-product-dir/shop-product-list', routeMap),
    ).toEqual([
      { path: '/shop-workspace/shop-dashboard', title: '工作台' },
      { path: '/shop-workspace/shop-product-dir/shop-product-list', title: '商品列表' },
    ]);

    expect(addPageTab(tabs, '/shop-workspace/shop-dashboard', routeMap)).toEqual(tabs);
  });

  it('closes active tab and falls back to the previous tab', () => {
    const tabs = [
      { path: '/shop-workspace/shop-dashboard', title: '工作台' },
      { path: '/shop-workspace/shop-product-dir/shop-product-list', title: '商品列表' },
      { path: '/shop-workspace/shop-product-dir/shop-category', title: '商品分类' },
    ];

    expect(
      closePageTab(tabs, '/shop-workspace/shop-product-dir/shop-category', '/shop-workspace/shop-product-dir/shop-category'),
    ).toEqual({
      tabs: [
        { path: '/shop-workspace/shop-dashboard', title: '工作台' },
        { path: '/shop-workspace/shop-product-dir/shop-product-list', title: '商品列表' },
      ],
      nextActivePath: '/shop-workspace/shop-product-dir/shop-product-list',
    });
  });
});
