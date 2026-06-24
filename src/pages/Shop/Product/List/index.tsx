import { PlusOutlined } from '@ant-design/icons';
import { ActionType, ProColumns, ProTable } from '@ant-design/pro-components';
import { history, useModel } from '@umijs/max';
import { Button, Image, message, Popconfirm, Switch, Tag } from 'antd';
import React, { useRef } from 'react';
import {
  deleteSpu,
  getSpuList,
  submitSpuAudit,
  toggleSpuStatus,
} from '@/services/ant-design-pro/api';

const auditStatusMap: Record<number, { text: string; color: string }> = {
  0: { text: '草稿', color: 'default' },
  1: { text: '待审核', color: 'processing' },
  2: { text: '已通过', color: 'success' },
  3: { text: '已驳回', color: 'error' },
};

const formatCurrency = (value: unknown) => {
  if (value === undefined || value === null || value === '') {
    return '-';
  }

  const amount = Number(value);
  return Number.isFinite(amount) ? `¥${amount.toFixed(2)}` : '-';
};

const ShopProductListPage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const shopId = initialState?.currentUser?.user?.shopId as number;
  const actionRef = useRef<ActionType>();

  const columns: ProColumns<API.SpuListVo>[] = [
    { title: 'ID', dataIndex: 'id', width: 60, search: false },
    {
      title: '主图',
      dataIndex: 'mainImage',
      search: false,
      width: 80,
      render: (_, record) =>
        record.mainImage ? <Image src={record.mainImage} width={50} height={50} /> : '-',
    },
    { title: '商品名称', dataIndex: 'name' },
    { title: '副标题', dataIndex: 'subtitle', search: false, ellipsis: true },
    {
      title: '最低价',
      dataIndex: 'minPrice',
      search: false,
      width: 90,
      render: (v) => formatCurrency(v),
    },
    { title: '总库存', dataIndex: 'totalStock', search: false, width: 80 },
    { title: '销量', dataIndex: 'saleCount', search: false, width: 80 },
    {
      title: '审核状态',
      dataIndex: 'auditStatus',
      search: false,
      width: 90,
      render: (v) => {
        const s = auditStatusMap[v as number] || { text: '未知', color: 'default' };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '上下架',
      dataIndex: 'status',
      search: false,
      width: 80,
      render: (_, record) => (
        <Switch
          checked={record.status === 1}
          checkedChildren="上架"
          unCheckedChildren="下架"
          disabled={record.auditStatus !== 2}
          onChange={async (checked) => {
            await toggleSpuStatus(record.id);
            message.success(checked ? '已上架' : '已下架');
            actionRef.current?.reload();
          }}
        />
      ),
    },
    {
      title: '驳回原因',
      dataIndex: 'rejectReason',
      search: false,
      ellipsis: true,
      render: (v, record) =>
        record.auditStatus === 3 ? <span style={{ color: 'red' }}>{v}</span> : '-',
    },
    { title: '创建时间', dataIndex: 'createTime', search: false, valueType: 'dateTime' },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) =>
        [
          <a
            key="edit"
            onClick={() =>
              history.push(
                `/shop-workspace/shop-product-dir/shop-product-create?id=${record.id}`,
              )
            }
          >
            编辑
          </a>,
          record.auditStatus === 0 || record.auditStatus === 3 ? (
            <Popconfirm
              key="submit"
              title="确认提交审核?"
              onConfirm={async () => {
                await submitSpuAudit(record.id);
                message.success('已提交审核');
                actionRef.current?.reload();
              }}
            >
              <a>提交审核</a>
            </Popconfirm>
          ) : null,
          <Popconfirm
            key="delete"
            title="确认删除该商品?"
            onConfirm={async () => {
              await deleteSpu(record.id);
              message.success('删除成功');
              actionRef.current?.reload();
            }}
          >
            <a style={{ color: 'red' }}>删除</a>
          </Popconfirm>,
        ].filter(Boolean),
    },
  ];

  return (
    <ProTable<API.SpuListVo>
      headerTitle="商品管理"
      actionRef={actionRef}
      rowKey="id"
      columns={columns}
      toolBarRender={() => [
        <Button
          key="add"
          type="primary"
          icon={<PlusOutlined />}
          onClick={() =>
            history.push('/shop-workspace/shop-product-dir/shop-product-create')
          }
        >
          新增商品
        </Button>,
      ]}
      request={async (params) => {
        const res = await getSpuList({
          current: params.current,
          size: params.pageSize,
          shopId,
          name: params.name,
        });
        return {
          data: res.data?.records || [],
          total: res.data?.total || 0,
          success: res.code === 200,
        };
      }}
    />
  );
};

export default ShopProductListPage;
