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

// ===== Shop-side Staff API =====
export async function getStaffList(params: any) {
  return request<API.R<API.PageResult<API.SysUser>>>('/admin/user/list', {
    method: 'GET',
    params,
  });
}

export async function createStaff(data: any) {
  return request<API.R<void>>('/admin/user', { method: 'POST', data });
}

export async function updateStaff(data: any) {
  return request<API.R<void>>('/admin/user', { method: 'PUT', data });
}

export async function deleteStaff(id: number) {
  return request<API.R<void>>(`/admin/user/${id}`, { method: 'DELETE' });
}

export async function resetStaffPassword(id: number) {
  return request<API.R<{ password: string }>>(`/admin/user/resetPwd/${id}`, { method: 'PUT' });
}

// ===== Shop-side Role API =====
export async function getShopRoleList(params: any) {
  return request<API.R<API.PageResult<API.SysRole>>>('/admin/role/list', {
    method: 'GET',
    params,
  });
}

export async function getShopRoles(shopId: number) {
  return request<API.R<API.SysRole[]>>('/admin/role/all', {
    method: 'GET',
    params: { shopId },
  });
}

export async function createShopRole(data: API.SysRole) {
  return request<API.R<void>>('/admin/role', { method: 'POST', data });
}

export async function updateShopRole(data: API.SysRole) {
  return request<API.R<void>>('/admin/role', { method: 'PUT', data });
}

export async function deleteShopRole(id: number) {
  return request<API.R<void>>(`/admin/role/${id}`, { method: 'DELETE' });
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
