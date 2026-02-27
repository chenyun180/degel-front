import { PlusOutlined } from '@ant-design/icons';
import { ActionType, ProColumns, ProTable } from '@ant-design/pro-components';
import { Button, Form, Input, DatePicker, message, Modal, Select, Switch } from 'antd';
import React, { useRef, useState } from 'react';
import { getShopList, createShop, updateShop, toggleShopStatus } from '@/services/ant-design-pro/api';

const ShopPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<API.SysShop | null>(null);
  const [form] = Form.useForm();

  const columns: ProColumns<API.SysShop>[] = [
    { title: 'ID', dataIndex: 'id', width: 60, search: false },
    { title: '店铺名称', dataIndex: 'shopName' },
    { title: '联系人', dataIndex: 'contactName', search: false },
    { title: '联系电话', dataIndex: 'contactPhone', search: false },
    {
      title: '状态', dataIndex: 'status',
      valueEnum: { 0: { text: '正常', status: 'Success' }, 1: { text: '停用', status: 'Error' } },
      render: (_, record) => (
        <Switch checked={record.status === 0} checkedChildren="正常" unCheckedChildren="停用"
          onChange={async (checked) => {
            await toggleShopStatus(record.id!, checked ? 0 : 1);
            message.success('状态更新成功');
            actionRef.current?.reload();
          }} />
      ),
    },
    { title: '有效期', dataIndex: 'expireTime', search: false, valueType: 'dateTime' },
    { title: '创建时间', dataIndex: 'createTime', search: false, valueType: 'dateTime' },
    {
      title: '操作', valueType: 'option',
      render: (_, record) => [
        <a key="edit" onClick={() => { setEditingShop(record); form.setFieldsValue(record); setModalOpen(true); }}>编辑</a>,
      ],
    },
  ];

  const handleOk = async () => {
    const values = await form.validateFields();
    if (values.expireTime) {
      values.expireTime = values.expireTime.format?.('YYYY-MM-DD HH:mm:ss') || values.expireTime;
    }
    if (editingShop?.id) {
      await updateShop({ ...values, id: editingShop.id });
      message.success('修改成功');
    } else {
      await createShop(values);
      message.success('创建成功');
    }
    setModalOpen(false);
    form.resetFields();
    setEditingShop(null);
    actionRef.current?.reload();
  };

  return (
    <>
      <ProTable<API.SysShop>
        headerTitle="店铺管理"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => {
            setEditingShop(null); form.resetFields(); setModalOpen(true);
          }}>新增店铺</Button>,
        ]}
        request={async (params) => {
          const res = await getShopList({ current: params.current, size: params.pageSize, ...params });
          return { data: res.data?.records || [], total: res.data?.total || 0, success: res.code === 200 };
        }}
      />
      <Modal title={editingShop ? '编辑店铺' : '新增店铺'} open={modalOpen} onOk={handleOk}
        onCancel={() => { setModalOpen(false); form.resetFields(); setEditingShop(null); }} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="shopName" label="店铺名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="contactName" label="联系人"><Input /></Form.Item>
          <Form.Item name="contactPhone" label="联系电话"><Input /></Form.Item>
          <Form.Item name="status" label="状态" initialValue={0}>
            <Select options={[{ label: '正常', value: 0 }, { label: '停用', value: 1 }]} />
          </Form.Item>
          <Form.Item name="expireTime" label="有效期"><DatePicker showTime style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ShopPage;
