import { expect, test } from '@playwright/test';
import { ADMIN, login, logout, SHOP } from './auth';

/**
 * 平台侧补充用例（文档：docs/e2e回归测试方案.md）
 * P1: shop token 直调平台看板 API 应被网关 admin-urls 拦截（API 级，直连网关 9999）
 * P2: 平台商品审核页显示测试待审商品
 */

test.describe('平台侧补充', () => {
  test('P1 shop token 直调平台看板 API 返回 403', async ({ request }) => {
    const basic = `Basic ${Buffer.from('degel:degel_secret').toString('base64')}`;
    const loginRes = await request.post(
      'http://localhost:9999/auth/oauth/token',
      {
        headers: { Authorization: basic },
        form: {
          grant_type: 'password',
          username: SHOP.username,
          password: SHOP.password,
        },
      },
    );
    expect(loginRes.ok()).toBeTruthy();
    const token = (await loginRes.json()).access_token;

    const res = await request.get(
      'http://localhost:9999/order/platform/dashboard/overview',
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    expect(res.status()).toBe(403);
  });

  test('P1b admin token 直调平台看板 API 正常', async ({ request }) => {
    const basic = `Basic ${Buffer.from('degel:degel_secret').toString('base64')}`;
    const loginRes = await request.post(
      'http://localhost:9999/auth/oauth/token',
      {
        headers: { Authorization: basic },
        form: {
          grant_type: 'password',
          username: ADMIN.username,
          password: ADMIN.password,
        },
      },
    );
    const token = (await loginRes.json()).access_token;

    const res = await request.get(
      'http://localhost:9999/order/platform/dashboard/overview',
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    expect(res.status()).toBe(200);
  });

  test('P2 平台商品审核页显示测试待审商品', async ({ page }) => {
    await logout(page);
    await login(page, ADMIN);
    await page.waitForURL('**/platform/dashboard', { timeout: 90_000 });

    await page.goto('/platform-product/audit');
    await expect(page.getByText('商品审核').first()).toBeVisible();
    // 造数的待审商品（shop 4 / shop 5 各一条）
    await expect(page.getByText('测试待审商品-4').first()).toBeVisible();
  });
});
