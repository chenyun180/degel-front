import { PlusOutlined } from '@ant-design/icons';
import { ActionType, ProColumns, ProTable } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Button, Form, Input, InputNumber, message, Modal, Popconfirm, Select } from 'antd';
import React, { useRef, useState } from 'react';
import {
  getShopRoleList, createShopRole, updateShopRole, deleteShopRole,
} from '@/services/ant-design-pro/api';

const ShopRolePage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const shopId = initialState?.currentUser?.user?.shopId as number;

  const actionRef = useRef<ActionType>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<API.SysRole | null>(null);
  const [form] = Form.useForm();

  const columns: ProColumns<API.SysRole>[] = [
    { title: 'ID', dataIndex: 'id', width: 60, search: false },
    { title: '角色名称', dataIndex: 'roleName' },
    { title: '角色标识', dataIndex: 'roleKey' },
    { title: '排序', dataIndex: 'sort', search: false, width: 60 },
    {
      title: '状态', dataIndex: 'status', search: false,
      valueEnum: { 0: { text: '正常', status: 'Success' }, 1: { text: '停用', status: 'Error' } },
    },
    { title: '备注', dataIndex: 'remark', search: false, ellipsis: true },
    {
      title: '操作', valueType: 'option',
      render: (_, record) => [
        <a key="edit" onClick={() => {
          setEditingRole(record);
          form.setFieldsValue({
            roleName: record.roleName,
            roleKey: record.roleKey,
            sort: record.sort,
            status: record.status,
            remark: record.remark,
          });
          setModalOpen(true);
        }}>编辑</a>,
        <Popconfirm key="delete" title="确认删除该角色?" onConfirm={async () => {
          await deleteShopRole(record.id!);
          message.success('删除成功');
          actionRef.current?.reload();
        }}><a style={{ color: 'red' }}>删除</a></Popconfirm>,
      ],
    },
  ];

  const handleOk = async () => {
    const values = await form.validateFields();
    if (editingRole?.id) {
      await updateShopRole({ ...values, id: editingRole.id });
      message.success('修改成功');
    } else {
      await createShopRole({ ...values, shopId, roleType: 'shop' });
      message.success('创建成功');
    }
    setModalOpen(false);
    form.resetFields();
    setEditingRole(null);
    actionRef.current?.reload();
  };

  return (
    <>
      <ProTable<API.SysRole>
        headerTitle="角色管理"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => {
            setEditingRole(null); form.resetFields(); setModalOpen(true);
          }}>新增角色</Button>,
        ]}
        request={async (params) => {
          const res = await getShopRoleList({
            current: params.current,
            size: params.pageSize,
            shopId,
            ...params,
          });
          return { data: res.data?.records || [], total: res.data?.total || 0, success: res.code === 200 };
        }}
      />
      <Modal
        title={editingRole ? '编辑角色' : '新增角色'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => { setModalOpen(false); form.resetFields(); setEditingRole(null); }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="roleName" label="角色名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="roleKey" label="角色标识" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="sort" label="排序" initialValue={1}><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="status" label="状态" initialValue={0}>
            <Select options={[{ label: '正常', value: 0 }, { label: '停用', value: 1 }]} />
          </Form.Item>
          <Form.Item name="remark" label="备注"><Input.TextArea /></Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ShopRolePage;
