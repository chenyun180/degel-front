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

  type FakeCaptcha = {
    code?: number;
    msg?: string;
    data?: string;
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
    roleType?: string;
    shopId?: number;
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

  type SkuAttributePair = {
    key?: string;
    value?: string;
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

  type AuditParams = {
    spuId: number;
    passed: boolean;
    rejectReason?: string;
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

  type ShopGmvRank = {
    shopId: number;
    gmv: number;
    orderCount: number;
  };

  type ProductGmvRank = {
    spuId: number;
    spuName: string;
    shopId: number;
    quantity: number;
    amount: number;
  };

  type PlatformDashboardOverview = {
    totalGmv: number;
    todayGmv: number;
    todayOrderCount: number;
    pendingShipCount: number;
    shopTop5: ShopGmvRank[];
    productTop5: ProductGmvRank[];
    /** 本月平台补贴（优惠券） */
  monthPlatformSubsidy?: number;};

  type DailyGmv = {
    date: string;
    gmv: number;
    orderCount: number;
  };

  type CouponItem = {
    id: string;
    name: string;
    /** 1=平台券 2=店铺券 3=分摊券 */
    funderType: number;
    shopId?: number;
    /** 1=满减 2=折扣 3=无门槛 */
    discountType: number;
    thresholdAmount?: number | string;
    discountValue: number | string;
    totalCount: number;
    issuedCount: number;
    perUserLimit: number;
    receiveStart?: string;
    receiveEnd?: string;
    validStart?: string;
    validEnd?: string;
    validDays?: number;
    /** 1=绝对时间 2=领取后N天 */
    validType?: number;
    /** 0=未生效 1=进行中 2=停发 */
    status: number;
    /** 1=待审核 2=已通过 3=已驳回 */
    auditStatus?: number;
    rejectReason?: string;
    platformAmount?: number | string;
    shopAmount?: number | string;
    createTime?: string;
  };

  type CouponCreateParams = {
    name: string;
    /** 1=平台券 2=店铺券 3=分摊券（平台建券用；店铺建券后端固定 2） */
    funderType?: number;
    shopId?: number;
    /** 分摊券出资拆分 */
    platformAmount?: number;
    shopAmount?: number;
    /** 1=满减 2=折扣 3=无门槛 */
    discountType: number;
    thresholdAmount?: number;
    discountValue: number;
    totalCount: number;
    perUserLimit: number;
    receiveStart?: string;
    receiveEnd?: string;
    /** 1=绝对时间 2=领取后N天 */
    validType: number;
    validStart?: string;
    validEnd?: string;
    validDays?: number;
  };
}
