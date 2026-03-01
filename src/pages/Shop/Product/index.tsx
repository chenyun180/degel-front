import { PlusOutlined } from '@ant-design/icons';
import { ActionType, ProColumns, ProTable } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Button, Form, Input, message, Modal, Popconfirm, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import {
  getSpuList, createSpu, updateSpu, deleteSpu, submitSpuAudit,
} from '@/services/ant-design-pro/api';

const auditStatusMap: Record<number, { text: string; color: string }> = {
  0: { text: '草稿', color: 'default' },
  1: { text: '待审核', color: 'processing' },
  2: { text: '已通过', color: 'success' },
  3: { text: '已驳回', color: 'error' },
};

const ShopProductPage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const shopId = initialState?.currentUser?.user?.shopId as number;

  const actionRef = useRef<ActionType>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSpu, setEditingSpu] = useState<API.ProductSpu | null>(null);
  const [form] = Form.useForm();

  const columns: ProColumns<API.ProductSpu>[] = [
    { title: 'ID', dataIndex: 'id', width: 60, search: false },
    { title: '商品名称', dataIndex: 'name' },
    { title: '描述', dataIndex: 'description', search: false, ellipsis: true },
    {
      title: '审核状态', dataIndex: 'auditStatus', search: false,
      render: (v) => {
        const s = auditStatusMap[v as number] || { text: '未知', color: 'default' };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '驳回原因', dataIndex: 'rejectReason', search: false, ellipsis: true,
      render: (v, record) => record.auditStatus === 3 ? <span style={{ color: 'red' }}>{v}</span> : '-',
    },
    { title: '创建时间', dataIndex: 'createTime', search: false, valueType: 'dateTime' },
    {
      title: '操作', valueType: 'option',
      render: (_, record) => [
        <a key="edit" onClick={() => {
          setEditingSpu(record);
          form.setFieldsValue({ name: record.name, description: record.description });
          setModalOpen(true);
        }}>编辑</a>,
        record.auditStatus === 0 || record.auditStatus === 3 ? (
          <Popconfirm key="submit" title="确认提交审核?" onConfirm={async () => {
            await submitSpuAudit(record.id!);
            message.success('已提交审核');
            actionRef.current?.reload();
          }}>
            <a>提交审核</a>
          </Popconfirm>
        ) : null,
        <Popconfirm key="delete" title="确认删除该商品?" onConfirm={async () => {
          await deleteSpu(record.id!);
          message.success('删除成功');
          actionRef.current?.reload();
        }}><a style={{ color: 'red' }}>删除</a></Popconfirm>,
      ].filter(Boolean),
    },
  ];

  const handleOk = async () => {
    const values = await form.validateFields();
    if (editingSpu?.id) {
      await updateSpu({ ...values, id: editingSpu.id });
      message.success('修改成功');
    } else {
      await createSpu({ ...values, shopId, auditStatus: 0 });
      message.success('创建成功');
    }
    setModalOpen(false);
    form.resetFields();
    setEditingSpu(null);
    actionRef.current?.reload();
  };

  return (
    <>
      <ProTable<API.ProductSpu>
        headerTitle="商品管理"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => {
            setEditingSpu(null); form.resetFields(); setModalOpen(true);
          }}>新增商品</Button>,
        ]}
        request={async (params) => {
          const res = await getSpuList({
            current: params.current,
            size: params.pageSize,
            shopId,
            name: params.name,
          });
          return { data: res.data?.records || [], total: res.data?.total || 0, success: res.code === 200 };
        }}
      />
      <Modal
        title={editingSpu ? '编辑商品' : '新增商品'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => { setModalOpen(false); form.resetFields(); setEditingSpu(null); }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="商品名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={4} /></Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ShopProductPage;
