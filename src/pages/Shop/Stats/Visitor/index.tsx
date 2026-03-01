import { ProColumns, ProTable } from '@ant-design/pro-components';
import { Image, Radio } from 'antd';
import React, { useState } from 'react';
import { getVisitorRankStats } from '@/services/ant-design-pro/api';

const LOW_CONVERSION_THRESHOLD = 0.05;

const ShopStatsVisitorPage: React.FC = () => {
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  const columns: ProColumns<API.VisitorRankVo>[] = [
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
    { title: '浏览次数', dataIndex: 'viewCount', search: false, width: 100 },
    { title: '下单次数', dataIndex: 'orderCount', search: false, width: 100 },
    {
      title: '转化率',
      dataIndex: 'conversionRate',
      search: false,
      width: 100,
      render: (v) => {
        const rate = v as number;
        const color = rate < LOW_CONVERSION_THRESHOLD ? '#ff4d4f' : undefined;
        return <span style={{ color }}>{(rate * 100).toFixed(2)}%</span>;
      },
    },
  ];

  return (
    <ProTable<API.VisitorRankVo>
      headerTitle="访客排行榜"
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
      rowClassName={(record) =>
        record.conversionRate < LOW_CONVERSION_THRESHOLD ? 'low-conversion-row' : ''
      }
      request={async () => {
        const res = await getVisitorRankStats({ period });
        return {
          data: res.data || [],
          success: res.code === 200,
        };
      }}
    />
  );
};

export default ShopStatsVisitorPage;
