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
  return request<API.R<void>>('/admin/shop', { method: 'POST', data });
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
