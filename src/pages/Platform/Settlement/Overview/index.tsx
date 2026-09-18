import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Row, Statistic, Table, Tooltip } from 'antd';
import React, { useEffect, useState } from 'react';
import { getSettlementOverview } from '@/services/ant-design-pro/api';

const money = (v: unknown) => `¥${(v as number)?.toFixed(2) ?? '0.00'}`;

const overviewColumns = [
  {
    key: 'commissionIncome',
    title: '累计佣金收入',
    tooltip: '已入账结算明细的佣金合计（退款扣回的不算）',
  },
  {
    key: 'subsidyPaid',
    title: '累计补贴支出',
    tooltip: '平台承担的券+积分抵扣，随结算基数付给了商家',
  },
  {
    key: 'withdrawPaid',
    title: '累计提现打款',
    tooltip: '审核通过（模拟打款）的提现合计',
  },
  {
    key: 'shopDebt',
    title: '商家欠款',
    tooltip: '商家余额为负的部分合计（结算后退款扣回所致）',
  },
];

const PlatformSettlementOverviewPage: React.FC = () => {
  const [overview, setOverview] = useState<API.SettlementOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettlementOverview()
      .then((res) => {
        if (res.code === 200) {
          setOverview(res.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageContainer>
      <Card loading={loading} title="资金总览">
        <Row gutter={[24, 24]}>
          {overviewColumns.map((c) => (
            <Col key={c.key} xs={12} md={6}>
              <Statistic
                title={c.title}
                value={overview?.[c.key as keyof API.SettlementOverview] ?? 0}
                precision={2}
                prefix="¥"
              />
              <Tooltip title={c.tooltip}>
                <span style={{ fontSize: 12, color: '#999' }}>口径说明</span>
              </Tooltip>
            </Col>
          ))}
        </Row>
      </Card>

      <Card loading={loading} title="资金水位" style={{ marginTop: 16 }}>
        <Table
          rowKey="key"
          pagination={false}
          size="small"
          dataSource={[
            {
              key: 'userPayNet',
              item: '用户支付净额（支付−退款）',
              value: overview?.userPayNet ?? 0,
              note: '来自 C 端支付流水（degel-app）',
            },
            {
              key: 'shopBalanceTotal',
              item: '平台对商家负债（商家余额合计）',
              value: -(overview?.shopBalanceTotal ?? 0),
              note: '负数表示商家欠款已抵销部分负债',
            },
            {
              key: 'netCashFlow',
              item: '平台净现金流',
              value: overview?.netCashFlow ?? 0,
              note: '用户支付净额 − 商家余额合计；负值=平台补贴垫资，模拟体系下属预期',
            },
          ]}
          columns={[
            { title: '项目', dataIndex: 'item' },
            {
              title: '金额',
              dataIndex: 'value',
              width: 140,
              render: (v) => money(v),
            },
            {
              title: '说明',
              dataIndex: 'note',
              render: (v) => <span style={{ color: '#999' }}>{v}</span>,
            },
          ]}
        />
      </Card>
    </PageContainer>
  );
};

export default PlatformSettlementOverviewPage;
