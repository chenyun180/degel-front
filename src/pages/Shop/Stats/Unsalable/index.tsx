import {
  PageContainer,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { Alert, Tag } from 'antd';
import React from 'react';
import { getUnsalableList } from '@/services/ant-design-pro/api';

const ShopStatsUnsalablePage: React.FC = () => {
  const columns: ProColumns<API.UnsalableVo>[] = [
    {
      title: '排名',
      dataIndex: 'index',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    { title: '商品名称', dataIndex: 'spuName', search: false },
    { title: 'SKU编码', dataIndex: 'skuCode', search: false, width: 120 },
    { title: '规格', dataIndex: 'specData', search: false, ellipsis: true },
    {
      title: '当前库存',
      dataIndex: 'stock',
      search: false,
      width: 90,
      render: (v) => <Tag color="orange">{v as number}</Tag>,
    },
    {
      title: '单价',
      dataIndex: 'price',
      search: false,
      width: 90,
      render: (v) => `¥${(v as number)?.toFixed(2)}`,
    },
    {
      title: '占压金额',
      dataIndex: 'occupyAmount',
      search: false,
      width: 110,
      render: (v) => (
        <span style={{ color: '#cf1322', fontWeight: 600 }}>
          ¥{(v as number)?.toFixed(2)}
        </span>
      ),
    },
    {
      title: 'SPU累计销量',
      dataIndex: 'saleCount',
      search: false,
      width: 110,
      render: (v) => (v as number) || 0,
    },
  ];

  return (
    <PageContainer>
      <Alert
        type="warning"
        showIcon
        message="滞销口径：近 30 天零销量且库存 > 0 的 SKU，按占压金额（库存×单价）倒序。建议对高占压商品做促销/下架处理"
        style={{ marginBottom: 16 }}
      />
      <ProTable<API.UnsalableVo>
        headerTitle="滞销预警"
        rowKey="skuId"
        search={false}
        columns={columns}
        pagination={{ defaultPageSize: 20 }}
        request={async () => {
          const res = await getUnsalableList(200);
          return {
            data: res.data || [],
            success: res.code === 200,
          };
        }}
      />
    </PageContainer>
  );
};

export default ShopStatsUnsalablePage;
