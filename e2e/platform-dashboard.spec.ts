import { expect, test } from '@playwright/test';
import { ADMIN, expectCanvasDrawn, login, logout, SHOP } from './auth';

test.describe('平台工作台（admin 数据看板）', () => {
  test.beforeEach(async ({ page }) => {
    await logout(page);
  });

  test('admin 登录后默认落在数据看板，卡片/榜单/折线图渲染', async ({
    page,
  }) => {
    await login(page, ADMIN);

    // 登录默认页 = 菜单首项（/platform/dashboard）
    await page.waitForURL('**/platform/dashboard', { timeout: 60_000 });

    // 左侧菜单出现「平台工作台」
    await expect(page.getByText('平台工作台').first()).toBeVisible();

    // 卡片：累计总流水显示造数基准值
    await expect(page.getByText('累计总流水')).toBeVisible();
    await expect(page.getByText('3,391.50').first()).toBeVisible({
      timeout: 10_000,
    });

    // 榜单：店铺 TOP5 含测试店铺、商品 TOP5 含造数商品快照名
    await expect(page.getByText('牛仔短裤')).toBeVisible();
    await expect(page.getByText('店铺流水 TOP5')).toBeVisible();

    // 折线图 echarts canvas 已绘制
    await expectCanvasDrawn(page);
  });

  test('折线图 30/90 天切换', async ({ page }) => {
    await login(page, ADMIN);
    await page.waitForURL('**/platform/dashboard', { timeout: 60_000 });

    // antd Radio.Button 原生 input 视觉隐藏，check() 不可用，点击 label 文本
    // 先注册响应监听再点击，避免响应在监听前完成的竞态
    const trendResponse = page.waitForResponse((res) =>
      res.url().includes('trend?days=90'),
    );
    await page.getByText('近 90 天', { exact: true }).click();
    await trendResponse;
    await expectCanvasDrawn(page);
  });

  test('admin 带 redirect 到有权页面时跳回原页', async ({ page }) => {
    await page.goto('/user/login?redirect=/system/user');
    await page.locator('#username').fill(ADMIN.username);
    await page.locator('#password').fill(ADMIN.password);
    await page
      .getByRole('button')
      .filter({ hasText: /登\s*录/ })
      .click();
    await page.waitForURL('**/system/user', { timeout: 60_000 });
  });
});

test.describe('权限边界（shop 账号）', () => {
  test.beforeEach(async ({ page }) => {
    await logout(page);
  });

  test('shop 登录默认落在店铺工作台', async ({ page }) => {
    await login(page, SHOP);
    await page.waitForURL('**/shop-workspace/shop-dashboard', {
      timeout: 60_000,
    });
  });

  test('shop 直链平台看板被前端拦截', async ({ page }) => {
    await login(page, SHOP);
    await page.waitForURL('**/shop-workspace/shop-dashboard', {
      timeout: 60_000,
    });

    await page.goto('/platform/dashboard');
    // umi access 插件渲染 403，不出现看板内容（冷启动渲染慢，用默认 30s 断言超时）
    await expect(page.getByText('累计总流水')).toHaveCount(0);
    await expect(page.getByText('403').first()).toBeVisible();
  });

  test('shop 带 redirect 到无权页面（/system/user）时兜底到店铺工作台', async ({
    page,
  }) => {
    await page.goto('/user/login?redirect=/system/user');
    await page.locator('#username').fill(SHOP.username);
    await page.locator('#password').fill(SHOP.password);
    await page
      .getByRole('button')
      .filter({ hasText: /登\s*录/ })
      .click();
    await page.waitForURL('**/shop-workspace/shop-dashboard', {
      timeout: 60_000,
    });
  });

  test('开放重定向防护：redirect=//evil.com 不外跳', async ({ page }) => {
    await page.goto('/user/login?redirect=//evil.com');
    await page.locator('#username').fill(ADMIN.username);
    await page.locator('#password').fill(ADMIN.password);
    await page
      .getByRole('button')
      .filter({ hasText: /登\s*录/ })
      .click();
    // 登录流程完成、离开登录页；redirect 被拒后应兜底到站内默认页
    await page.waitForURL((url) => !url.href.includes('/user/login'), {
      timeout: 60_000,
    });
    const finalUrl = page.url();
    expect(finalUrl).toMatch(/^http:\/\/localhost:8000\//);
    expect(finalUrl).not.toContain('//evil.com');
  });
});
