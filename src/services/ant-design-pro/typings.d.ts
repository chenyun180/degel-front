declare namespace API {
  type CurrentUser = {
    user: {
      id: number;
      username: string;
      nickname: string;
      phone: string;
      email: string;
      avatar: string;
      status: number;
      shopId: number;
    };
    roles: string[];
    permissions: string[];
    routers: any[];
  };

  type LoginResult = {
    access_token?: string;
    token_type?: string;
    refresh_token?: string;
    expires_in?: number;
    user_id?: number;
    shop_id?: number;
    error?: string;
    error_description?: string;
  };

  type LoginParams = {
    username: string;
    password: string;
  };

  type R<T> = {
    code: number;
    msg: string;
    data: T;
  };

  type PageResult<T> = {
    records: T[];
    total: number;
    size: number;
    current: number;
    pages: number;
  };

  type SysUser = {
    id?: number;
    username?: string;
    password?: string;
    nickname?: string;
    phone?: string;
    email?: string;
    avatar?: string;
    status?: number;
    shopId?: number;
    createTime?: string;
    roleIds?: number[];
  };

  type SysRole = {
    id?: number;
    roleName?: string;
    roleKey?: string;
    sort?: number;
    status?: number;
    remark?: string;
    createTime?: string;
  };

  type SysMenu = {
    id?: number;
    parentId?: number;
    menuName?: string;
    path?: string;
    component?: string;
    perms?: string;
    icon?: string;
    menuType?: string;
    sort?: number;
    visible?: number;
    status?: number;
    children?: SysMenu[];
  };

  type SysShop = {
    id?: number;
    shopName?: string;
    contactName?: string;
    contactPhone?: string;
    status?: number;
    expireTime?: string;
    createTime?: string;
  };
}
