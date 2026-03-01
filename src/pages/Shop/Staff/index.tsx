import { PlusOutlined } from '@ant-design/icons';
import { ActionType, ProColumns, ProTable } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Button, Form, Input, message, Modal, Popconfirm, Select, Tag } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import {
  getStaffList, createStaff, updateStaff, deleteStaff, resetStaffPassword, getShopRoles,
} from '@/services/ant-design-pro/api';

const ShopStaffPage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const shopId = initialState?.currentUser?.user?.shopId as number;

  const actionRef = useRef<ActionType>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<API.SysUser | null>(null);
  const [roles, setRoles] = useState<API.SysRole[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!shopId) return;
    getShopRoles(shopId).then((res) => {
      if (res.code === 200) setRoles(res.data || []);
    });
  }, [shopId]);

  const columns: ProColumns<API.SysUser>[] = [
    { title: 'ID', dataIndex: 'id', width: 60, search: false },
    { title: '用户名', dataIndex: 'username', search: false },
    { title: '昵称', dataIndex: 'nickname' },
    { title: '手机号', dataIndex: 'phone', search: false },
    {
      title: '状态', dataIndex: 'status', search: false,
      render: (v) => <Tag color={v === 0 ? 'green' : 'red'}>{v === 0 ? '正常' : '停用'}</Tag>,
    },
    { title: '创建时间', dataIndex: 'createTime', search: false, valueType: 'dateTime' },
    {
      title: '操作', valueType: 'option',
      render: (_, record) => [
        <a key="edit" onClick={() => {
          setEditingStaff(record);
          form.setFieldsValue({
            nickname: record.nickname,
            phone: record.phone,
            email: record.email,
            status: record.status,
            roleIds: record.roleIds,
          });
          setModalOpen(true);
        }}>编辑</a>,
        <a key="reset" onClick={async () => {
          const res = await resetStaffPassword(record.id!);
          if (res.code === 200) {
            Modal.success({ title: '密码重置成功', content: `新密码：${res.data?.password}` });
          }
        }}>重置密码</a>,
        <Popconfirm key="delete" title="确认删除该员工?" onConfirm={async () => {
          await deleteStaff(record.id!);
          message.success('删除成功');
          actionRef.current?.reload();
        }}><a style={{ color: 'red' }}>删除</a></Popconfirm>,
      ],
    },
  ];

  const handleOk = async () => {
    const values = await form.validateFields();
    if (editingStaff?.id) {
      await updateStaff({ ...values, id: editingStaff.id });
      message.success('修改成功');
    } else {
      await createStaff({ ...values, shopId });
      message.success('创建成功');
    }
    setModalOpen(false);
    form.resetFields();
    setEditingStaff(null);
    actionRef.current?.reload();
  };

  return (
    <>
      <ProTable<API.SysUser>
        headerTitle="员工管理"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => {
            setEditingStaff(null); form.resetFields(); setModalOpen(true);
          }}>新增员工</Button>,
        ]}
        request={async (params) => {
          const res = await getStaffList({
            current: params.current,
            size: params.pageSize,
            shopId,
            ...params,
          });
          return { data: res.data?.records || [], total: res.data?.total || 0, success: res.code === 200 };
        }}
      />
      <Modal
        title={editingStaff ? '编辑员工' : '新增员工'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => { setModalOpen(false); form.resetFields(); setEditingStaff(null); }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          {!editingStaff && (
            <>
              <Form.Item name="username" label="用户名" rules={[{ required: true }]}><Input /></Form.Item>
              <Form.Item name="password" label="初始密码" rules={[{ required: true }]}><Input.Password /></Form.Item>
            </>
          )}
          <Form.Item name="nickname" label="昵称"><Input /></Form.Item>
          <Form.Item name="phone" label="手机号"><Input /></Form.Item>
          <Form.Item name="email" label="邮箱"><Input /></Form.Item>
          <Form.Item name="status" label="状态" initialValue={0}>
            <Select options={[{ label: '正常', value: 0 }, { label: '停用', value: 1 }]} />
          </Form.Item>
          <Form.Item name="roleIds" label="角色">
            <Select
              mode="multiple"
              placeholder="请选择角色"
              options={roles.map((r) => ({ label: r.roleName, value: r.id }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ShopStaffPage;
