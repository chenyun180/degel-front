import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { Radio, Tag, Typography } from 'antd';
import React, { useRef, useState } from 'react';
import { getSearchWordStats } from '@/services/ant-design-pro/api';
import type { ActionType } from '@ant-design/pro-components';

/**
 * 平台搜索词分析（数据源：C 端搜索埋点 product_search_log，2026-09-18 起积累）。
 * 空结果次数 = 用户搜了但平台没货的词——选品/上架缺口的直接信号。
 */
const PlatformSearchWordsPage: React.FC = () => {
  const actionRef = useRef<ActionType>(undefined);
  const [days, setDays] = useState(30);

  const columns: ProColumns<API.SearchWordStat>[] = [
    {
      title: '排名',
      valueType: 'index',
      width: 64,
    },
    {
      title: '搜索词',
      dataIndex: 'keyword',
      copyable: true,
    },
    {
      title: '搜索次数',
      dataIndex: 'searchCount',
      width: 110,
      sorter: (a, b) => a.searchCount - b.searchCount,
    },
    {
      title: '搜索人数',
      dataIndex: 'userCount',
      width: 110,
      render: (_, r) =>
        r.userCount > 0 ? r.userCount : <Tag>仅匿名</Tag>,
    },
    {
      title: '空结果次数',
      dataIndex: 'zeroResultCount',
      width: 110,
      render: (_, r) =>
        r.zeroResultCount > 0 ? (
          <Tag color="red">{r.zeroResultCount}</Tag>
        ) : (
          0
        ),
    },
    {
      title: '空结果占比',
      width: 110,
      render: (_, r) =>
        r.searchCount > 0
          ? `${Math.round((r.zeroResultCount / r.searchCount) * 100)}%`
          : '-',
    },
    {
      title: '最近搜索',
      dataIndex: 'lastSearchTime',
      width: 170,
      render: (_, r) =>
        r.lastSearchTime ? r.lastSearchTime.replace('T', ' ').slice(0, 19) : '-',
    },
  ];

  return (
    <PageContainer
      header={{
        title: '搜索词分析',
        extra: [
          <Radio.Group
            key="days"
            value={days}
            onChange={(e) => {
              setDays(e.target.value);
              actionRef.current?.reload();
            }}
            options={[
              { label: '近 7 天', value: 7 },
              { label: '近 30 天', value: 30 },
              { label: '近 90 天', value: 90 },
            ]}
            optionType="button"
          />,
        ],
      }}
    >
      <ProTable<API.SearchWordStat>
        headerTitle="搜索词 Top 100"
        actionRef={actionRef}
        rowKey="keyword"
        search={false}
        toolBarRender={false}
        params={{ days }}
        request={async (params) => {
          const res = await getSearchWordStats({ days: params.days });
          return {
            data: res.data || [],
            success: res.code === 200,
            total: res.data?.length || 0,
          };
        }}
        columns={columns}
        pagination={false}
        locale={{ emptyText: '暂无搜索数据（埋点已上线，数据将随 C 端搜索自然积累）' }}
      />
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        口径：仅 C 端第一页搜索；空结果也记录（占比高说明用户需求未被满足）；纯分类浏览不计。
      </Typography.Text>
    </PageContainer>
  );
};

export default PlatformSearchWordsPage;
