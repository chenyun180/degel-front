import { ProColumns, ProTable } from '@ant-design/pro-components';
import { Tag } from 'antd';
import React from 'react';
import { getCategoryTree } from '@/services/ant-design-pro/api';

const normalizeCategories = (
  items: API.ProductCategory[] = [],
): API.ProductCategory[] =>
  items.map((item) => {
    const children = normalizeCategories(item.children || []);
    return {
      ...item,
      children: children.length > 0 ? children : undefined,
    };
  });

const columns: ProColumns<API.ProductCategory>[] = [
  { title: '分类名称', dataIndex: 'name' },
  { title: 'ID', dataIndex: 'id', width: 60, search: false },
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
      expandable={{ childrenColumnName: 'children', columnWidth: 40 }}
      pagination={false}
      request={async () => {
        const res = await getCategoryTree();
        return {
          data: normalizeCategories(res.data || []),
          success: res.code === 200,
        };
      }}
    />
  );
};

export default ShopCategoryPage;
