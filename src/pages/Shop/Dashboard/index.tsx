import {
  AlertOutlined,
  AuditOutlined,
  ShoppingCartOutlined,
  TruckOutlined,
} from '@ant-design/icons';
import { ProColumns, ProTable } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Card, Col, Row, Statistic } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  getDashboardOverview,
  getPendingCounts,
  getStockWarningList,
} from '@/services/ant-design-pro/api';

const pendingItems = (counts: API.PendingCounts) => [
  {
    label: '待发货',
    count: counts.pendingShipment,
    icon: <TruckOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
    path: '/shop-workspace/shop-order-dir/shop-order-ship',
  },
  {
    label: '待处理售后',
    count: counts.pendingAfterSale,
    icon: <ShoppingCartOutlined style={{ fontSize: 24, color: '#faad14' }} />,
    path: '/shop-workspace/shop-order-dir/shop-aftersale',
  },
  {
    label: '库存预警',
    count: counts.stockWarningCount,
    icon: <AlertOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />,
    path: '',
  },
  {
    label: '待审核',
    count: counts.pendingAudit,
    icon: <AuditOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
    path: '/shop-workspace/shop-product-dir/shop-product-list',
  },
];

const stockColumns: ProColumns<API.StockWarningVo>[] = [
  { title: '商品名称', dataIndex: 'spuName', search: false },
  { title: 'SKU编码', dataIndex: 'skuCode', search: false },
  { title: '规格', dataIndex: 'specData', search: false, ellipsis: true },
  { title: '当前库存', dataIndex: 'stock', search: false, width: 100 },
  {
    title: '预警值',
    dataIndex: 'stockWarning',
    search: false,
    width: 100,
    render: (v) => <span style={{ color: '#ff4d4f' }}>{v as number}</span>,
  },
];

const ShopDashboardPage: React.FC = () => {
  const [overview, setOverview] = useState<API.DashboardOverview | null>(null);
  const [counts, setCounts] = useState<API.PendingCounts>({
    pendingShipment: 0,
    pendingAfterSale: 0,
    stockWarningCount: 0,
    pendingAudit: 0,
  });

  useEffect(() => {
    getDashboardOverview()
      .then((res) => {
        if (res.code === 200) setOverview(res.data);
      })
      .catch(() => {});
    getPendingCounts()
      .then((res) => {
        if (res.code === 200) setCounts(res.data);
      })
      .catch(() => {});
  }, []);

  const totalPending =
    counts.pendingShipment +
    counts.pendingAfterSale +
    counts.stockWarningCount +
    counts.pendingAudit;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日 GMV"
              value={overview?.todayGmv ?? '--'}
              prefix="¥"
              precision={2}
            />
            {overview?.yesterdayGmv !== undefined && (
              <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                昨日 ¥{overview.yesterdayGmv.toFixed(2)}
              </div>
            )}
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="今日订单数" value={overview?.todayOrderCount ?? '--'} />
            {overview?.yesterdayOrderCount !== undefined && (
              <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                昨日 {overview.yesterdayOrderCount} 单
              </div>
            )}
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="今日访客数" value={overview?.todayVisitorCount ?? '--'} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="待处理事项" value={totalPending} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>

      <Card title="待处理事项">
        <Row gutter={16}>
          {pendingItems(counts).map((item) => (
            <Col span={6} key={item.label}>
              <Card
                hoverable={!!item.path}
                onClick={() => item.path && history.push(item.path)}
                style={{ textAlign: 'center' }}
              >
                {item.icon}
                <div style={{ marginTop: 8, fontSize: 24, fontWeight: 600 }}>{item.count}</div>
                <div style={{ color: '#666' }}>{item.label}</div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <ProTable<API.StockWarningVo>
        headerTitle="库存预警"
        rowKey="skuCode"
        columns={stockColumns}
        search={false}
        request={async (params) => {
          try {
            const res = await getStockWarningList({
              current: params.current,
              size: params.pageSize,
            });
            return {
              data: res.data?.records || [],
              total: res.data?.total || 0,
              success: res.code === 200,
            };
          } catch {
            return { data: [], total: 0, success: false };
          }
        }}
        pagination={{ pageSize: 5 }}
      />
    </div>
  );
};

export default ShopDashboardPage;
