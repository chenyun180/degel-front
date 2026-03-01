declare namespace API {
  type RouterItem = {
    name?: string;
    path?: string;
    component?: string;
    hidden?: boolean;
    redirect?: string;
    meta?: { title?: string; icon?: string };
    children?: RouterItem[];
  };

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
    routers: RouterItem[];
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
    logo?: string;
    announcement?: string;
    description?: string;
    status?: number;
    expireTime?: string;
    createTime?: string;
  };

  type ProductSpu = {
    id?: number;
    shopId?: number;
    categoryId?: number;
    name?: string;
    subtitle?: string;
    description?: string;
    detailContent?: string;
    mainImage?: string;
    images?: string;
    keyword?: string;
    auditStatus?: number;
    rejectReason?: string;
    status?: number;
    saleCount?: number;
    viewCount?: number;
    createTime?: string;
  };

  type ProductSku = {
    id?: number;
    spuId?: number;
    skuCode?: string;
    specData?: string;
    price?: number;
    originalPrice?: number;
    costPrice?: number;
    stock?: number;
    stockWarning?: number;
    weight?: number;
    image?: string;
    status?: number;
    createTime?: string;
  };

  type SpuDetailVo = {
    spu: ProductSpu;
    skuList: ProductSku[];
  };

  type SpuListVo = {
    id: number;
    shopId: number;
    categoryId: number;
    name: string;
    subtitle: string;
    mainImage: string;
    auditStatus: number;
    rejectReason: string;
    status: number;
    saleCount: number;
    minPrice: number;
    totalStock: number;
    createTime: string;
  };

  type ProductCategory = {
    id?: number;
    parentId?: number;
    name?: string;
    sort?: number;
    icon?: string;
    status?: number;
    children?: ProductCategory[];
  };

  type OrderInfo = {
    id?: number;
    orderNo?: string;
    userId?: number;
    shopId?: number;
    totalAmount?: number;
    freightAmount?: number;
    discountAmount?: number;
    payAmount?: number;
    status?: number;
    payTime?: string;
    shipTime?: string;
    receiveTime?: string;
    cancelTime?: string;
    receiverName?: string;
    receiverPhone?: string;
    receiverAddress?: string;
    remark?: string;
    expressCompany?: string;
    expressNo?: string;
    createTime?: string;
  };

  type OrderItem = {
    id?: number;
    orderId?: number;
    spuId?: number;
    skuId?: number;
    spuName?: string;
    skuSpec?: string;
    skuImage?: string;
    price?: number;
    quantity?: number;
    totalAmount?: number;
  };

  type OrderDetailVo = {
    order: OrderInfo;
    items: OrderItem[];
  };

  type AfterSale = {
    id?: number;
    orderId?: number;
    orderItemId?: number;
    userId?: number;
    shopId?: number;
    type?: number;
    status?: number;
    reason?: string;
    refundAmount?: number;
    expressCompany?: string;
    expressNo?: string;
    merchantRemark?: string;
    createTime?: string;
  };

  type DashboardOverview = {
    todayGmv: number;
    todayOrderCount: number;
    todayVisitorCount: number;
    yesterdayGmv: number;
    yesterdayOrderCount: number;
  };

  type StockWarningVo = {
    spuName: string;
    skuCode: string;
    specData: string;
    stock: number;
    stockWarning: number;
  };

  type PendingCounts = {
    pendingShipment: number;
    pendingAfterSale: number;
    stockWarningCount: number;
    pendingAudit: number;
  };

  type HotSaleVo = {
    spuId: number;
    spuName: string;
    mainImage: string;
    saleCount: number;
    saleAmount: number;
    growthRate: number;
  };

  type VisitorRankVo = {
    spuId: number;
    spuName: string;
    mainImage: string;
    viewCount: number;
    orderCount: number;
    conversionRate: number;
  };
}
