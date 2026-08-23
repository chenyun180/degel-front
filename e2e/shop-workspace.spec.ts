import { expect, test } from '@playwright/test';
import { login, logout, SHOP } from './auth';

/**
 * 店铺端（shop-workspace）回归用例。
 * 数据依赖：remark='平台看板测试数据' 的种子订单（shop 5 含待发货订单）。
 * 文档：docs/e2e回归测试方案.md
 */

const ORDER_LIST_PATH = '/shop-workspace/shop-order-dir/shop-order-list';

test.describe('店铺端回归（shop 账号）', () => {
  test.beforeEach(async ({ page }) => {
    await logout(page);
    await login(page, SHOP);
    await page.waitForURL('**/shop-workspace/shop-dashboard', {
      timeout: 90_000,
    });
  });

  test('S1 店铺工作台三接口全通，库存预警空数据不报错', async ({ page }) => {
    await expect(page.getByText('今日 GMV')).toBeVisible();
    // 接口失败会弹「系统繁忙」/错误 message，断言不出现
    await expect(page.getByText('系统繁忙')).toHaveCount(0);
    await expect(page.getByText('加载失败')).toHaveCount(0);
  });

  test('S2 全部订单列表显示测试订单', async ({ page }) => {
    await page.goto(ORDER_LIST_PATH);
    await expect(page.getByText('订单管理').first()).toBeVisible();
    // 种子订单号以 TEST 开头（shop 5 有 10 单）
    await expect(page.getByText('TEST2026').first()).toBeVisible();
    await expect(page.getByText('系统繁忙')).toHaveCount(0);
  });

  test('S3 订单详情抽屉', async ({ page }) => {
    await page.goto(ORDER_LIST_PATH);
    await page.getByText('TEST2026').first().waitFor();
    // 行内操作是 <a> 无 href（无 link role），用精确文本定位
    await page.getByText('详情', { exact: true }).first().click();
    await expect(page.getByText('订单详情')).toBeVisible();
    // 页面上有多个「订单编号」（搜索框/表头/抽屉内），须取抽屉内那一个
    await expect(page.getByLabel('订单详情').getByText('订单编号')).toBeVisible();
    await expect(page.getByText('商品明细')).toBeVisible();
  });

  test('S4+S5 待发货列表与发货操作（状态流转）', async ({ page }) => {
    // 直接用「待发货订单」页——不要点订单列表的状态 tab：
    // 顶部 PageTabs 也有同名"待发货"标签且是真链接，getByRole('tab') 会命中它跳走
    await page.goto('/shop-workspace/shop-order-dir/shop-order-ship');
    await expect(page.getByText('待发货订单').first()).toBeVisible();
    await page.getByText('TEST2026').first().waitFor();

    // 对第一条待发货订单发货（行内操作 <a> 无 href，用精确文本）
    const deliverApi = page.waitForResponse(
      (res) =>
        res.url().includes('/order/deliver') &&
        res.request().method() === 'PUT',
    );
    await page.getByText('发货', { exact: true }).first().click();
    await expect(page.getByText('订单发货')).toBeVisible();
    await page.locator('#expressCompany').fill('e2e测试快递');
    await page.locator('#expressNo').fill('E2E' + Date.now());
    await page.getByRole('button', { name: /确\s*定/ }).click();
    const res = await deliverApi;
    expect(res.status()).toBe(200);
    await expect(page.getByText('发货成功')).toBeVisible();
  });

  test('S6 售后管理页（空列表不报 IN() 错误）', async ({ page }) => {
    await page.goto('/shop-workspace/shop-order-dir/shop-aftersale');
    await expect(page.getByText('售后管理').first()).toBeVisible();
    await expect(page.getByText('系统繁忙')).toHaveCount(0);
  });

  test('S7 商品列表/发布/分类三页可达', async ({ page }) => {
    await page.goto('/shop-workspace/shop-product-dir/shop-product-list');
    await expect(page.getByText('商品管理').first()).toBeVisible();

    await page.goto('/shop-workspace/shop-product-dir/shop-product-create');
    await expect(page.getByText('基本信息')).toBeVisible();

    await page.goto('/shop-workspace/shop-product-dir/shop-category');
    await expect(page.getByText('商品分类').first()).toBeVisible();
  });

  test('S8 热销榜/访客榜', async ({ page }) => {
    await page.goto('/shop-workspace/shop-stats-dir/shop-stats-hot');
    await expect(page.getByText('热销排行榜').first()).toBeVisible();

    await page.goto('/shop-workspace/shop-stats-dir/shop-stats-visitor');
    await expect(page.getByText('访客排行榜').first()).toBeVisible();
  });

  test('S9 店铺信息显示隔离店铺（测试店铺2）', async ({ page }) => {
    await page.goto('/shop-workspace/shop-setting/shop-info');
    await expect(page.locator('#shopName')).toHaveValue('测试店铺2');
  });
});
