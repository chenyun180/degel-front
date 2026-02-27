import { PlusOutlined } from '@ant-design/icons';
import { ActionType, ProColumns, ProTable } from '@ant-design/pro-components';
import { Button, Form, Input, InputNumber, message, Modal, Popconfirm, Select, Tag } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import {
  getUserList, createUser, updateUser, deleteUser, getAllRoles,
} from '@/services/ant-design-pro/api';

const UserPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<API.SysUser | null>(null);
  const [roles, setRoles] = useState<API.SysRole[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    getAllRoles().then((res) => {
      if (res.code === 200) setRoles(res.data || []);
    });
  }, []);

  const columns: ProColumns<API.SysUser>[] = [
    { title: 'ID', dataIndex: 'id', width: 60, search: false },
    { title: '用户名', dataIndex: 'username' },
    { title: '昵称', dataIndex: 'nickname' },
    { title: '手机号', dataIndex: 'phone', search: false },
    { title: '邮箱', dataIndex: 'email', search: false },
    {
      title: '状态', dataIndex: 'status', valueEnum: { 0: { text: '正常', status: 'Success' }, 1: { text: '停用', status: 'Error' } },
    },
    { title: '创建时间', dataIndex: 'createTime', search: false, valueType: 'dateTime' },
    {
      title: '操作', valueType: 'option',
      render: (_, record) => [
        <a key="edit" onClick={() => { setEditingUser(record); form.setFieldsValue(record); setModalOpen(true); }}>编辑</a>,
        <Popconfirm key="delete" title="确认删除?" onConfirm={async () => {
          await deleteUser(record.id!);
          message.success('删除成功');
          actionRef.current?.reload();
        }}><a style={{ color: 'red' }}>删除</a></Popconfirm>,
      ],
    },
  ];

  const handleOk = async () => {
    const values = await form.validateFields();
    if (editingUser?.id) {
      await updateUser({ ...values, id: editingUser.id });
      message.success('修改成功');
    } else {
      await createUser(values);
      message.success('创建成功');
    }
    setModalOpen(false);
    form.resetFields();
    setEditingUser(null);
    actionRef.current?.reload();
  };

  return (
    <>
      <ProTable<API.SysUser>
        headerTitle="用户管理"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => {
            setEditingUser(null); form.resetFields(); setModalOpen(true);
          }}>新增用户</Button>,
        ]}
        request={async (params) => {
          const res = await getUserList({ current: params.current, size: params.pageSize, ...params });
          return { data: res.data?.records || [], total: res.data?.total || 0, success: res.code === 200 };
        }}
      />
      <Modal title={editingUser ? '编辑用户' : '新增用户'} open={modalOpen} onOk={handleOk}
        onCancel={() => { setModalOpen(false); form.resetFields(); setEditingUser(null); }} destroyOnClose>
        <Form form={form} layout="vertical">
          {!editingUser && <Form.Item name="username" label="用户名" rules={[{ required: true }]}><Input /></Form.Item>}
          {!editingUser && <Form.Item name="password" label="密码" rules={[{ required: true }]}><Input.Password /></Form.Item>}
          <Form.Item name="nickname" label="昵称"><Input /></Form.Item>
          <Form.Item name="phone" label="手机号"><Input /></Form.Item>
          <Form.Item name="email" label="邮箱"><Input /></Form.Item>
          <Form.Item name="status" label="状态" initialValue={0}>
            <Select options={[{ label: '正常', value: 0 }, { label: '停用', value: 1 }]} />
          </Form.Item>
          <Form.Item name="shopId" label="所属店铺ID" initialValue={0}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="roleIds" label="角色">
            <Select mode="multiple" placeholder="请选择角色" options={roles.map((r) => ({ label: r.roleName, value: r.id }))} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default UserPage;
