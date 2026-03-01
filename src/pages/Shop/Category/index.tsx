import { ProColumns, ProTable } from '@ant-design/pro-components';
import { Tag } from 'antd';
import React from 'react';
import { getCategoryTree } from '@/services/ant-design-pro/api';

const columns: ProColumns<API.ProductCategory>[] = [
  { title: 'ID', dataIndex: 'id', width: 60, search: false },
  { title: '分类名称', dataIndex: 'name' },
  { title: '排序', dataIndex: 'sort', search: false, width: 80 },
  { title: '图标', dataIndex: 'icon', search: false, ellipsis: true },
  {
    title: '状态',
    dataIndex: 'status',
    search: false,
    width: 80,
    render: (v) => (
      <Tag color={v === 0 ? 'green' : 'red'}>{v === 0 ? '启用' : '停用'}</Tag>
    ),
  },
];

const ShopCategoryPage: React.FC = () => {
  return (
    <ProTable<API.ProductCategory>
      headerTitle="商品分类"
      rowKey="id"
      columns={columns}
      search={false}
      toolBarRender={false}
      expandable={{ childrenColumnName: 'children' }}
      pagination={false}
      request={async () => {
        const res = await getCategoryTree();
        return {
          data: res.data || [],
          success: res.code === 200,
        };
      }}
    />
  );
};

export default ShopCategoryPage;
