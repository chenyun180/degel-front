import { defineConfig, devices } from '@playwright/test';

/**
 * 端到端测试配置
 * - 使用本地 Chrome（channel: 'chrome'），不下载 Playwright 自带浏览器
 * - dev server 已在跑则复用（reuseExistingServer），没跑则自动启动
 * - 前置依赖：后端链路（Nacos/MySQL/Redis + gateway/auth/admin/product/order）
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false, // 登录态互相干扰，串行执行
  retries: 0,
  // dev server 按需编译 + 新 context 冷启动渲染较慢（实测菜单渲染 ~22s，路由首编可达 45s+）
  // 且 utoopack dev 在编译压力下代理请求偶发失败（表现为空表格/无网络日志）——环境抖动用 retries 兜底
  timeout: 240_000,
  expect: { timeout: 90_000 },
  retries: 2,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:8000',
    channel: 'chrome', // 驱动本机 Chrome
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'zh-CN',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
