import { chromium, type FullConfig } from '@playwright/test';
import { ADMIN, SHOP } from './auth';

/**
 * 全局预热：逐个访问被测路由，触发 utoopack 按需编译。
 * dev server 在编译压力下代理转发偶发失败（表格空数据/表单空值），
 * 先把所有 chunk 编译完，正式用例运行时 dev server 空闲、代理稳定。
 */
export default async function globalSetup(_config: FullConfig) {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  const shopRoutes = [
    '/shop-workspace/shop-dashboard',
    '/shop-workspace/shop-order-dir/shop-order-list',
    '/shop-workspace/shop-order-dir/shop-order-ship',
    '/shop-workspace/shop-order-dir/shop-aftersale',
    '/shop-workspace/shop-product-dir/shop-product-list',
    '/shop-workspace/shop-product-dir/shop-product-create',
    '/shop-workspace/shop-product-dir/shop-category',
    '/shop-workspace/shop-stats-dir/shop-stats-hot',
    '/shop-workspace/shop-stats-dir/shop-stats-visitor',
    '/shop-workspace/shop-setting/shop-info',
  ];
  const adminRoutes = [
    '/platform/dashboard',
    '/system/user',
    '/platform-product/audit',
  ];

  const warm = async (account: typeof SHOP, routes: string[]) => {
    const page = await browser.newPage();
    await page.goto('http://localhost:8000/user/login');
    await page.waitForSelector('#username', { timeout: 120_000 });
    await page.locator('#username').fill(account.username);
    await page.locator('#password').fill(account.password);
    await page
      .getByRole('button')
      .filter({ hasText: /登\s*录/ })
      .click();
    // 等待跳转完成（首个 chunk 编译最慢）
    await page.waitForURL((url) => !url.href.includes('/user/login'), {
      timeout: 180_000,
    });
    for (const route of routes) {
      await page.goto(`http://localhost:8000${route}`, {
        waitUntil: 'domcontentloaded',
      });
      // 等路由内容挂载（正文区非空即认为 chunk 已编译并渲染）
      await page
        .locator('.ant-layout-content, .ant-pro-layout-content, main')
        .first()
        .waitFor({ timeout: 180_000 });
      await page.waitForTimeout(2000);
      console.log(`  warmed: ${route}`);
    }
    await page.close();
  };

  console.log('globalSetup: 预热店铺端路由...');
  await warm(SHOP, shopRoutes);
  console.log('globalSetup: 预热平台端路由...');
  await warm(ADMIN, adminRoutes);
  await browser.close();
  console.log('globalSetup: 预热完成');
}
