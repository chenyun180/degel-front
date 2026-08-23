import { expect, type Page } from '@playwright/test';

export const ADMIN = { username: 'admin', password: 'admin123' };
// e2e 专用店铺账号（由测试数据脚本创建，密码与 admin 相同，shop_id=4）
export const SHOP = { username: 'e2e_shop_test', password: 'admin123' };

/** 在登录页登录并等待跳转完成（登录成功是整页跳转 window.location.href） */
export async function login(
  page: Page,
  account: { username: string; password: string },
) {
  await page.goto('/user/login');
  await page.locator('#username').fill(account.username);
  await page.locator('#password').fill(account.password);
  await page
    .getByRole('button')
    .filter({ hasText: /登\s*录/ })
    .click();
}

/** 退出登录并清空本地登录态（token 存 localStorage；须先到站内页面，about:blank 上访问 localStorage 会被浏览器拒绝） */
export async function logout(page: Page) {
  await page.goto('/user/login');
  await page.evaluate(() => {
    localStorage.removeItem('degel_access_token');
    localStorage.removeItem('degel_open_page_tabs');
  });
}

/** 断言 echarts 已渲染出非空白画布 */
export async function expectCanvasDrawn(page: Page) {
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible();
  // 画布尺寸 > 0，说明 echarts init 成功
  const box = await canvas.boundingBox();
  expect(box && box.width > 100 && box.height > 100).toBeTruthy();
}
