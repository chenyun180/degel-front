import { PlusOutlined } from '@ant-design/icons';
import { ActionType, ProColumns, ProTable } from '@ant-design/pro-components';
import { Button, Descriptions, Form, Input, DatePicker, message, Modal, Select, Switch } from 'antd';
import React, { useRef, useState } from 'react';
import dayjs from 'dayjs';
import { getShopList, createShop, updateShop, toggleShopStatus } from '@/services/ant-design-pro/api';

const ShopPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<API.SysShop | null>(null);
  const [accountInfo, setAccountInfo] = useState<{ username: string; password: string } | null>(null);
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
        <a key="edit" onClick={() => {
          setEditingShop(record);
          form.setFieldsValue({
            ...record,
            expireTime: record.expireTime ? dayjs(record.expireTime) : undefined,
          });
          setModalOpen(true);
        }}>编辑</a>,
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
      setModalOpen(false);
      form.resetFields();
      setEditingShop(null);
      actionRef.current?.reload();
    } else {
      const res = await createShop(values);
      setModalOpen(false);
      form.resetFields();
      setEditingShop(null);
      actionRef.current?.reload();
      if (res.code === 200 && res.data) {
        setAccountInfo(res.data);
      }
    }
  };

  return (
    <>
      <Modal
        title="店铺创建成功"
        open={!!accountInfo}
        onOk={() => setAccountInfo(null)}
        onCancel={() => setAccountInfo(null)}
        cancelButtonProps={{ style: { display: 'none' } }}
        okText="我已记录，关闭"
      >
        <p style={{ marginBottom: 16, color: '#fa8c16' }}>请妥善保管以下登录信息，密码仅展示一次：</p>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="登录账号">{accountInfo?.username}</Descriptions.Item>
          <Descriptions.Item label="初始密码">{accountInfo?.password}</Descriptions.Item>
        </Descriptions>
      </Modal>
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
