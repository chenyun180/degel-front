import { PlusOutlined } from '@ant-design/icons';
import { ActionType, ProColumns, ProTable } from '@ant-design/pro-components';
import { Button, Form, Input, InputNumber, message, Modal, Popconfirm, Select, Tree } from 'antd';
import React, { useRef, useState } from 'react';
import {
  getRoleList, createRole, updateRole, deleteRole, getMenuTree, assignMenus, getRoleMenuIds,
} from '@/services/ant-design-pro/api';

const RolePage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [modalOpen, setModalOpen] = useState(false);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<API.SysRole | null>(null);
  const [currentRoleId, setCurrentRoleId] = useState<number>(0);
  const [menuTree, setMenuTree] = useState<API.SysMenu[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<number[]>([]);
  const [form] = Form.useForm();

  const columns: ProColumns<API.SysRole>[] = [
    { title: 'ID', dataIndex: 'id', width: 60, search: false },
    { title: '角色名称', dataIndex: 'roleName' },
    { title: '角色标识', dataIndex: 'roleKey' },
    { title: '排序', dataIndex: 'sort', search: false, width: 60 },
    {
      title: '状态', dataIndex: 'status', valueEnum: { 0: { text: '正常', status: 'Success' }, 1: { text: '停用', status: 'Error' } },
    },
    { title: '备注', dataIndex: 'remark', search: false, ellipsis: true },
    { title: '创建时间', dataIndex: 'createTime', search: false, valueType: 'dateTime' },
    {
      title: '操作', valueType: 'option',
      render: (_, record) => [
        <a key="edit" onClick={() => { setEditingRole(record); form.setFieldsValue(record); setModalOpen(true); }}>编辑</a>,
        <a key="perm" onClick={async () => {
          setCurrentRoleId(record.id!);
          const [treeRes, idsRes] = await Promise.all([getMenuTree(), getRoleMenuIds(record.id!)]);
          if (treeRes.code === 200) setMenuTree(treeRes.data || []);
          if (idsRes.code === 200) setCheckedKeys(idsRes.data || []);
          setMenuModalOpen(true);
        }}>分配权限</a>,
        <Popconfirm key="delete" title="确认删除?" onConfirm={async () => {
          await deleteRole(record.id!);
          message.success('删除成功');
          actionRef.current?.reload();
        }}><a style={{ color: 'red' }}>删除</a></Popconfirm>,
      ],
    },
  ];

  const handleOk = async () => {
    const values = await form.validateFields();
    if (editingRole?.id) {
      await updateRole({ ...values, id: editingRole.id });
      message.success('修改成功');
    } else {
      await createRole(values);
      message.success('创建成功');
    }
    setModalOpen(false);
    form.resetFields();
    setEditingRole(null);
    actionRef.current?.reload();
  };

  const handleAssignMenus = async () => {
    await assignMenus(currentRoleId, checkedKeys);
    message.success('权限分配成功');
    setMenuModalOpen(false);
  };

  const convertTreeData = (menus: API.SysMenu[]): any[] =>
    menus.map((m) => ({
      key: m.id, title: m.menuName,
      children: m.children ? convertTreeData(m.children) : [],
    }));

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
          const res = await getRoleList({ current: params.current, size: params.pageSize, ...params });
          return { data: res.data?.records || [], total: res.data?.total || 0, success: res.code === 200 };
        }}
      />
      <Modal title={editingRole ? '编辑角色' : '新增角色'} open={modalOpen} onOk={handleOk}
        onCancel={() => { setModalOpen(false); form.resetFields(); setEditingRole(null); }} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="roleName" label="角色名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="roleKey" label="角色标识" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="sort" label="排序" initialValue={0}><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="status" label="状态" initialValue={0}>
            <Select options={[{ label: '正常', value: 0 }, { label: '停用', value: 1 }]} />
          </Form.Item>
          <Form.Item name="remark" label="备注"><Input.TextArea /></Form.Item>
        </Form>
      </Modal>
      <Modal title="分配菜单权限" open={menuModalOpen} onOk={handleAssignMenus}
        onCancel={() => setMenuModalOpen(false)} width={500}>
        <Tree
          checkable
          defaultExpandAll
          checkedKeys={checkedKeys}
          onCheck={(keys: any) => setCheckedKeys(keys as number[])}
          treeData={convertTreeData(menuTree)}
        />
      </Modal>
    </>
  );
};

export default RolePage;
