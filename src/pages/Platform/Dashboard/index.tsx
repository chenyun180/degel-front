import { history } from '@umijs/max';
import { App, Card, Col, Radio, Row, Statistic, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useMemo, useState } from 'react';
import EChart from '@/components/EChart';
import {
  getPendingCounts,
  getPlatformDashboardOverview,
  getPlatformDashboardTrend,
  getShopList,
} from '@/services/ant-design-pro/api';

const PRIMARY_COLOR = '#1677ff';

const shopColumns = (
  shopNames: Map<number, string>,
): ColumnsType<API.ShopGmvRank> => [
  {
    title: '排名',
    width: 60,
    render: (_v, _r, index) => index + 1,
  },
  {
    title: '店铺',
    dataIndex: 'shopId',
    render: (shopId: number) => shopNames.get(shopId) || `店铺#${shopId}`,
  },
  {
    title: '流水',
    dataIndex: 'gmv',
    align: 'right',
    render: (v: number) => `¥${Number(v).toFixed(2)}`,
  },
  {
    title: '订单数',
    dataIndex: 'orderCount',
    align: 'right',
    width: 90,
  },
];

const productColumns = (
  shopNames: Map<number, string>,
): ColumnsType<API.ProductGmvRank> => [
  {
    title: '排名',
    width: 60,
    render: (_v, _r, index) => index + 1,
  },
  {
    title: '商品',
    dataIndex: 'spuName',
    ellipsis: true,
  },
  {
    title: '所属店铺',
    dataIndex: 'shopId',
    width: 140,
    ellipsis: true,
    render: (shopId: number) => shopNames.get(shopId) || `店铺#${shopId}`,
  },
  {
    title: '销量',
    dataIndex: 'quantity',
    align: 'right',
    width: 80,
  },
  {
    title: '销售额',
    dataIndex: 'amount',
    align: 'right',
    width: 110,
    render: (v: number) => `¥${Number(v).toFixed(2)}`,
  },
];

const PlatformDashboardPage: React.FC = () => {
  const { message } = App.useApp();

  const [overview, setOverview] =
    useState<API.PlatformDashboardOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [shopCount, setShopCount] = useState<number | null>(null);
  const [shopListLoading, setShopListLoading] = useState(true);
  const [pendingAudit, setPendingAudit] = useState<number | null>(null);
  const [shopNames, setShopNames] = useState<Map<number, string>>(new Map());
  const [trendDays, setTrendDays] = useState<30 | 90>(30);
  const [trend, setTrend] = useState<API.DailyGmv[]>([]);
  const [trendLoading, setTrendLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    setOverviewLoading(true);
    getPlatformDashboardOverview()
      .then((res) => {
        if (!cancelled && res.code === 200) setOverview(res.data);
      })
      .catch((err) => {
        if (!cancelled)
          message.error(
            err?.response?.data?.msg || err?.data?.msg || '看板数据加载失败',
          );
      })
      .finally(() => {
        if (!cancelled) setOverviewLoading(false);
      });

    getPendingCounts()
      .then((res) => {
        if (!cancelled && res.code === 200)
          setPendingAudit(res.data?.pendingAudit ?? 0);
      })
      .catch(() => {
        if (!cancelled) setPendingAudit(null);
      });

    // 店铺总数 + 店铺名映射（供 TOP5 表格展示）
    getShopList({ current: 1, pageSize: 100 })
      .then((res) => {
        if (cancelled || res.code !== 200) return;
        const records = res.data?.records || [];
        setShopCount(res.data?.total ?? records.length);
        setShopNames(
          new Map(
            records
              .filter((s) => s.id != null && s.shopName != null)
              .map((s) => [s.id as number, s.shopName as string]),
          ),
        );
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setShopListLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [message]);

  useEffect(() => {
    let cancelled = false;
    setTrendLoading(true);
    getPlatformDashboardTrend({ days: trendDays })
      .then((res) => {
        if (!cancelled && res.code === 200) setTrend(res.data || []);
      })
      .catch((err) => {
        if (!cancelled)
          message.error(
            err?.response?.data?.msg || err?.data?.msg || '流水趋势加载失败',
          );
      })
      .finally(() => {
        if (!cancelled) setTrendLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [trendDays, message]);

  const trendOption = useMemo(
    () => ({
      color: [PRIMARY_COLOR],
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line' },
        valueFormatter: (value: unknown) => `¥${Number(value).toFixed(2)}`,
      },
      grid: { left: 56, right: 24, top: 24, bottom: 32 },
      xAxis: {
        type: 'category',
        data: trend.map((d) => d.date),
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#d9d9d9' } },
        axisLabel: { color: '#8c8c8c' },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: '流水（元）',
        nameTextStyle: { color: '#8c8c8c' },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
        axisLabel: { color: '#8c8c8c' },
      },
      series: [
        {
          name: '日流水',
          type: 'line',
          data: trend.map((d) => Number(d.gmv)),
          lineStyle: { width: 2 },
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: false,
          areaStyle: { color: 'rgba(22, 119, 255, 0.08)' },
          emphasis: { focus: 'series' },
        },
      ],
    }),
    [trend],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card loading={overviewLoading}>
            <Statistic
              title="累计总流水"
              value={overview ? Number(overview.totalGmv) : '--'}
              prefix="¥"
              precision={2}
            />
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              已支付口径，退款不冲减
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={overviewLoading}>
            <Statistic
              title="今日流水"
              value={overview ? Number(overview.todayGmv) : '--'}
              prefix="¥"
              precision={2}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={overviewLoading}>
            <Statistic
              title="今日订单数"
              value={overview ? overview.todayOrderCount : '--'}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            hoverable
            onClick={() => history.push('/system/shop')}
            loading={shopListLoading}
          >
            <Statistic title="店铺总数" value={shopCount ?? '--'} />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            hoverable
            onClick={() => history.push('/platform-product/audit')}
            loading={pendingAudit === null}
          >
            <Statistic
              title="待审核商品"
              value={pendingAudit ?? '--'}
              valueStyle={pendingAudit ? { color: '#faad14' } : undefined}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={overviewLoading}>
            <Statistic
              title="待发货订单"
              value={overview ? overview.pendingShipCount : '--'}
              valueStyle={
                overview?.pendingShipCount ? { color: '#faad14' } : undefined
              }
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="店铺流水 TOP5" size="small">
            <Table<API.ShopGmvRank>
              rowKey="shopId"
              size="small"
              columns={shopColumns(shopNames)}
              dataSource={overview?.shopTop5 || []}
              pagination={false}
              loading={overviewLoading}
              locale={{ emptyText: '暂无数据' }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="畅销商品 TOP5" size="small">
            <Table<API.ProductGmvRank>
              rowKey="spuId"
              size="small"
              columns={productColumns(shopNames)}
              dataSource={overview?.productTop5 || []}
              pagination={false}
              loading={overviewLoading}
              locale={{ emptyText: '暂无数据' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="平台流水趋势"
        extra={
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={trendDays}
            onChange={(e) => setTrendDays(e.target.value as 30 | 90)}
            options={[
              { label: '近 30 天', value: 30 },
              { label: '近 90 天', value: 90 },
            ]}
          />
        }
      >
        <EChart option={trendOption} loading={trendLoading} height={360} />
      </Card>
    </div>
  );
};

export default PlatformDashboardPage;
