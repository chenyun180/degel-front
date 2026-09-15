import { request } from '@umijs/max';

const TOKEN_KEY = 'degel_access_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function login(params: API.LoginParams) {
  const formData = new URLSearchParams();
  formData.append('grant_type', 'password');
  formData.append('client_id', 'degel');
  formData.append('client_secret', 'degel_secret');
  formData.append('username', params.username);
  formData.append('password', params.password);

  return request<API.LoginResult>('/auth/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: formData.toString(),
    skipErrorHandler: true,
  });
}

export async function outLogin() {
  const token = getToken();
  if (token) {
    try {
      await request('/auth/token', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        skipErrorHandler: true,
      });
    } catch (_) {
      // ignore
    }
  }
  removeToken();
}

export async function currentUser(options?: { [key: string]: any }) {
  return request<API.R<API.CurrentUser>>('/admin/user/info', {
    method: 'GET',
    ...(options || {}),
  });
}

// ===== User API =====
export async function getUserList(params: any) {
  return request<API.R<API.PageResult<API.SysUser>>>('/admin/user/list', {
    method: 'GET',
    params,
  });
}

export async function createUser(data: any) {
  return request<API.R<void>>('/admin/user', { method: 'POST', data });
}

export async function updateUser(data: any) {
  return request<API.R<void>>('/admin/user', { method: 'PUT', data });
}

export async function deleteUser(id: number) {
  return request<API.R<void>>(`/admin/user/${id}`, { method: 'DELETE' });
}

// ===== Role API =====
export async function getRoleList(params: any) {
  return request<API.R<API.PageResult<API.SysRole>>>('/admin/role/list', {
    method: 'GET',
    params,
  });
}

export async function getAllRoles() {
  return request<API.R<API.SysRole[]>>('/admin/role/all', { method: 'GET' });
}

export async function createRole(data: API.SysRole) {
  return request<API.R<void>>('/admin/role', { method: 'POST', data });
}

export async function updateRole(data: API.SysRole) {
  return request<API.R<void>>('/admin/role', { method: 'PUT', data });
}

export async function deleteRole(id: number) {
  return request<API.R<void>>(`/admin/role/${id}`, { method: 'DELETE' });
}

export async function assignMenus(roleId: number, menuIds: number[]) {
  return request<API.R<void>>('/admin/role/assignMenus', {
    method: 'PUT',
    data: { roleId, menuIds },
  });
}

export async function getRoleMenuIds(roleId: number) {
  return request<API.R<number[]>>(`/admin/role/menuIds/${roleId}`, { method: 'GET' });
}

// ===== Menu API =====
export async function getMenuTree() {
  return request<API.R<API.SysMenu[]>>('/admin/menu/tree', { method: 'GET' });
}

export async function getMenuList() {
  return request<API.R<API.SysMenu[]>>('/admin/menu/list', { method: 'GET' });
}

export async function createMenu(data: API.SysMenu) {
  return request<API.R<void>>('/admin/menu', { method: 'POST', data });
}

export async function updateMenu(data: API.SysMenu) {
  return request<API.R<void>>('/admin/menu', { method: 'PUT', data });
}

export async function deleteMenu(id: number) {
  return request<API.R<void>>(`/admin/menu/${id}`, { method: 'DELETE' });
}

// ===== Shop API =====
export async function getShopList(params: any) {
  return request<API.R<API.PageResult<API.SysShop>>>('/admin/shop/list', {
    method: 'GET',
    params,
  });
}

export async function createShop(data: API.SysShop) {
  return request<API.R<{ username: string; password: string }>>('/admin/shop', { method: 'POST', data });
}

export async function updateShop(data: API.SysShop) {
  return request<API.R<void>>('/admin/shop', { method: 'PUT', data });
}

export async function toggleShopStatus(id: number, status: number) {
  return request<API.R<void>>('/admin/shop/status', {
    method: 'PUT',
    params: { id, status },
  });
}

export async function getShopById(id: number) {
  return request<API.R<API.SysShop>>(`/admin/shop/${id}`, { method: 'GET' });
}

// ===== Shop Product API =====
export async function getSpuList(params: any) {
  return request<API.R<API.PageResult<API.SpuListVo>>>('/product/spu/list', {
    method: 'GET',
    params,
  });
}

export async function getSpuById(id: number) {
  return request<API.R<API.ProductSpu>>(`/product/spu/${id}`, { method: 'GET' });
}

/** 按商品查 SKU 列表（秒杀/轮播等商品选择器用；含价格/规格/库存/状态） */
export async function getSkuListBySpu(spuId: number | string) {
  return request<API.R<API.AppSkuVo[]>>('/product/sku/list', {
    method: 'GET',
    params: { spuId },
  });
}

export async function createSpu(data: Partial<API.ProductSpu>) {
  return request<API.R<void>>('/product/spu', { method: 'POST', data });
}

export async function updateSpu(data: Partial<API.ProductSpu>) {
  return request<API.R<void>>('/product/spu', { method: 'PUT', data });
}

export async function deleteSpu(id: number) {
  return request<API.R<void>>(`/product/spu/${id}`, { method: 'DELETE' });
}

export async function submitSpuAudit(id: number) {
  return request<API.R<void>>(`/product/spu/submit/${id}`, { method: 'PUT' });
}

// 店铺端：批量提交审核
export async function submitSpuAuditBatch(ids: number[]) {
  return request<API.R<number>>('/product/spu/submitBatch', { method: 'PUT', data: ids });
}

// 平台端：审核商品（通过/驳回）
export async function auditSpu(data: API.AuditParams) {
  return request<API.R<void>>('/product/spu/audit', { method: 'PUT', data });
}

export async function getSpuDetail(id: number) {
  return request<API.R<API.SpuDetailVo>>(`/product/spu/${id}`, { method: 'GET' });
}

export async function updateSkuStock(data: { skuId: number; stock: number }) {
  return request<API.R<void>>('/product/sku/stock', { method: 'PUT', data });
}

export async function uploadFile(file: File, bucket: 'public' | 'private' = 'public') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucket', bucket);

  return request<API.R<string>>('/file/upload', {
    method: 'POST',
    data: formData,
  });
}

export async function getCategoryTree() {
  return request<API.R<API.ProductCategory[]>>('/product/category/tree', { method: 'GET' });
}

export async function createCategory(data: API.ProductCategory) {
  return request<API.R<void>>('/product/category', { method: 'POST', data });
}

export async function updateCategory(data: API.ProductCategory) {
  return request<API.R<void>>('/product/category', { method: 'PUT', data });
}

export async function deleteCategory(id: number) {
  return request<API.R<void>>(`/product/category/${id}`, { method: 'DELETE' });
}

export async function toggleSpuStatus(id: number) {
  return request<API.R<void>>(`/product/spu/toggle-status/${id}`, {
    method: 'PUT',
  });
}

export async function getMyShop() {
  return request<API.R<API.SysShop>>('/admin/shop/mine', { method: 'GET' });
}

export async function updateMyShop(data: Partial<API.SysShop>) {
  return request<API.R<void>>('/admin/shop/mine', { method: 'PUT', data });
}

export async function getOrderList(params: any) {
  return request<API.R<API.PageResult<API.OrderInfo>>>('/order/list', { method: 'GET', params });
}

export async function getOrderDetail(id: number) {
  return request<API.R<API.OrderDetailVo>>(`/order/${id}`, { method: 'GET' });
}

export async function deliverOrder(data: {
  orderId: number;
  expressCompany: string;
  expressNo: string;
}) {
  return request<API.R<void>>('/order/deliver', { method: 'PUT', data });
}

export async function exportOrders(params: any) {
  return request('/order/export', {
    method: 'GET',
    params,
    responseType: 'blob',
  });
}

export async function getAfterSaleList(params: any) {
  return request<API.R<API.PageResult<API.AfterSale>>>('/order/after-sale/list', {
    method: 'GET',
    params,
  });
}

export async function handleAfterSale(data: {
  afterSaleId: number;
  action: 'agree' | 'reject';
  merchantRemark?: string;
}) {
  return request<API.R<void>>('/order/after-sale/handle', { method: 'PUT', data });
}

export async function confirmAfterSaleReceive(data: { afterSaleId: number }) {
  return request<API.R<void>>('/order/after-sale/confirm-receive', { method: 'PUT', data });
}

export async function getDashboardOverview() {
  return request<API.R<API.DashboardOverview>>('/product/dashboard/today-overview', {
    method: 'GET',
  });
}

export async function getStockWarningList(params: any) {
  return request<API.R<API.PageResult<API.StockWarningVo>>>('/product/dashboard/stock-warning', {
    method: 'GET',
    params,
  });
}

export async function getPendingCounts() {
  return request<API.R<API.PendingCounts>>('/product/dashboard/pending-counts', { method: 'GET' });
}

export async function getHotSaleStats(params: { period: 'week' | 'month' }) {
  return request<API.R<API.HotSaleVo[]>>('/product/stats/hot-sale', { method: 'GET', params });
}

export async function getVisitorRankStats(params: { period: 'week' | 'month' }) {
  return request<API.R<API.VisitorRankVo[]>>('/product/stats/visitor-rank', {
    method: 'GET',
    params,
  });
}

// ===== Platform Dashboard API（平台工作台，仅平台管理员） =====
export async function getPlatformDashboardOverview() {
  return request<API.R<API.PlatformDashboardOverview>>(
    '/order/platform/dashboard/overview',
    { method: 'GET' },
  );
}

export async function getPlatformDashboardTrend(params: { days: number }) {
  return request<API.R<API.DailyGmv[]>>('/order/platform/dashboard/trend', {
    method: 'GET',
    params,
  });
}

// ===================== 优惠券（三期） =====================

/** 平台端建券（funderType 1 平台 / 3 分摊；分摊需 shopId+platformAmount+shopAmount） */
export async function createPlatformCoupon(data: API.CouponCreateParams) {
  return request<API.R<API.CouponItem>>('/marketing/platform/coupon', { method: 'POST', data });
}

/** 平台审核店铺券 */
export async function auditShopCoupon(data: { couponId: string; passed: boolean; rejectReason?: string }) {
  return request<API.R<null>>('/marketing/platform/coupon/audit', { method: 'PUT', data });
}

/** 平台券列表（全部券型；auditStatus 过滤审核 Tab） */
export async function getPlatformCoupons(params: {
  current?: number;
  size?: number;
  name?: string;
  status?: number;
  auditStatus?: number;
}) {
  return request<API.R<API.PageResult<API.CouponItem>>>('/marketing/platform/coupon/list', {
    method: 'GET',
    params,
  });
}

/** 平台停发券（平台券/分摊券/已通过店铺券） */
export async function stopPlatformCoupon(couponId: string) {
  return request<API.R<null>>(`/marketing/platform/coupon/stop/${couponId}`, { method: 'PUT' });
}

/** 店铺端建券（提交后待平台审核） */
export async function createShopCoupon(data: API.CouponCreateParams) {
  return request<API.R<API.CouponItem>>('/marketing/shop/coupon', { method: 'POST', data });
}

/** 本店券列表 */
export async function getShopCoupons(params: {
  current?: number;
  size?: number;
  name?: string;
  status?: number;
}) {
  return request<API.R<API.PageResult<API.CouponItem>>>('/marketing/shop/coupon/list', {
    method: 'GET',
    params,
  });
}

/** 店铺停发本店券 */
export async function stopShopCoupon(couponId: string) {
  return request<API.R<null>>(`/marketing/shop/coupon/stop/${couponId}`, { method: 'PUT' });
}

/** 本月店铺补贴（degel-order 统计端点） */
export async function getShopSubsidySummary() {
  return request<API.R<{ monthShopSubsidy: number }>>('/order/shop/dashboard/subsidy-summary', {
    method: 'GET',
  });
}

// ===================== 轮播图（营销） =====================

/** 平台轮播图分页（title 模糊 + status 筛选；注意分页参数是 page/pageSize） */
export async function getBannerPage(params: {
  page?: number;
  pageSize?: number;
  title?: string;
  status?: number;
}) {
  return request<API.R<API.PageResult<API.BannerItem>>>(
    '/marketing/platform/banner/page',
    { method: 'GET', params },
  );
}

/** 新增/编辑轮播图（id 空=新增；linkType=0 时 linkValue 传 null） */
export async function saveBanner(data: API.BannerSaveParams) {
  return request<API.R<null>>('/marketing/platform/banner', {
    method: 'POST',
    data,
  });
}

/** 上/下架取反（1↔0） */
export async function toggleBannerStatus(id: string) {
  return request<API.R<null>>(`/marketing/platform/banner/toggle-status/${id}`, {
    method: 'PUT',
  });
}

/** 逻辑删除 */
export async function deleteBanner(id: string) {
  return request<API.R<null>>(`/marketing/platform/banner/${id}`, {
    method: 'DELETE',
  });
}

// ===================== 秒杀场次/场次商品（营销） =====================

/** 秒杀场次分页（name 模糊 + status 筛选；分页参数是 page/pageSize） */
export async function getSeckillSessionPage(params: {
  page?: number;
  pageSize?: number;
  name?: string;
  status?: number;
}) {
  return request<API.R<API.PageResult<API.SeckillSessionItem>>>(
    '/marketing/platform/seckill/session/page',
    { method: 'GET', params },
  );
}

/** 新增/编辑秒杀场次（id 空=新增；status 不在入参，新建默认停用） */
export async function saveSeckillSession(data: API.SeckillSessionSaveParams) {
  return request<API.R<null>>('/marketing/platform/seckill/session', {
    method: 'POST',
    data,
  });
}

/** 逻辑删除秒杀场次 */
export async function deleteSeckillSession(id: string) {
  return request<API.R<null>>(`/marketing/platform/seckill/session/${id}`, {
    method: 'DELETE',
  });
}

/** 场次启用/停用取反（1↔0） */
export async function toggleSeckillSessionStatus(id: string) {
  return request<API.R<null>>(
    `/marketing/platform/seckill/session/toggle-status/${id}`,
    { method: 'PUT' },
  );
}

/** 场次商品分页（sessionId 必传；分页参数是 page/pageSize） */
export async function getSeckillProductPage(params: {
  sessionId: string;
  page?: number;
  pageSize?: number;
}) {
  return request<API.R<API.PageResult<API.SeckillProductItem>>>(
    '/marketing/platform/seckill/product/page',
    { method: 'GET', params },
  );
}

/** 新增/编辑场次商品（id 空=新增） */
export async function saveSeckillProduct(data: API.SeckillProductSaveParams) {
  return request<API.R<null>>('/marketing/platform/seckill/product', {
    method: 'POST',
    data,
  });
}

/** 删除场次商品 */
export async function deleteSeckillProduct(id: string) {
  return request<API.R<null>>(`/marketing/platform/seckill/product/${id}`, {
    method: 'DELETE',
  });
}
