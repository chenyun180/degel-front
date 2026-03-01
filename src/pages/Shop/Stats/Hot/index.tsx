import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { ProColumns, ProTable } from '@ant-design/pro-components';
import { Image, Radio } from 'antd';
import React, { useState } from 'react';
import { getHotSaleStats } from '@/services/ant-design-pro/api';

const ShopStatsHotPage: React.FC = () => {
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  const columns: ProColumns<API.HotSaleVo>[] = [
    {
      title: '排名',
      dataIndex: 'index',
      width: 60,
      search: false,
      render: (_, __, index) => index + 1,
    },
    {
      title: '主图',
      dataIndex: 'mainImage',
      search: false,
      width: 70,
      render: (_, record) =>
        record.mainImage ? <Image src={record.mainImage} width={40} height={40} /> : '-',
    },
    { title: '商品名称', dataIndex: 'spuName', search: false },
    { title: '销量', dataIndex: 'saleCount', search: false, width: 80 },
    {
      title: '销售额',
      dataIndex: 'saleAmount',
      search: false,
      width: 120,
      render: (v) => `¥${(v as number).toFixed(2)}`,
    },
    {
      title: '增长率',
      dataIndex: 'growthRate',
      search: false,
      width: 120,
      render: (v) => {
        const rate = v as number;
        if (rate > 0)
          return (
            <span style={{ color: '#52c41a' }}>
              <ArrowUpOutlined /> {(rate * 100).toFixed(1)}%
            </span>
          );
        if (rate < 0)
          return (
            <span style={{ color: '#ff4d4f' }}>
              <ArrowDownOutlined /> {(Math.abs(rate) * 100).toFixed(1)}%
            </span>
          );
        return <span>0%</span>;
      },
    },
  ];

  return (
    <ProTable<API.HotSaleVo>
      headerTitle="热销排行榜"
      rowKey="spuId"
      columns={columns}
      search={false}
      pagination={false}
      toolbar={{
        actions: [
          <Radio.Group
            key="period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            optionType="button"
            buttonStyle="solid"
            options={[
              { label: '本周', value: 'week' },
              { label: '本月', value: 'month' },
            ]}
          />,
        ],
      }}
      params={{ period }}
      request={async () => {
        const res = await getHotSaleStats({ period });
        return {
          data: res.data || [],
          success: res.code === 200,
        };
      }}
    />
  );
};

export default ShopStatsHotPage;
