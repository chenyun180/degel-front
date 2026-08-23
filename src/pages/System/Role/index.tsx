import { PlusOutlined } from '@ant-design/icons';
import { ActionType, ProColumns, ProTable } from '@ant-design/pro-components';
import { Alert, Button, Form, Input, InputNumber, message, Modal, Popconfirm, Select, Tag, Tree } from 'antd';
import React, { useRef, useState } from 'react';
import {
  getRoleList, createRole, updateRole, deleteRole, getMenuTree, assignMenus, getRoleMenuIds,
} from '@/services/ant-design-pro/api';

// 内置角色（与后端 Constants.ROLE_KEY_ADMIN / ROLE_KEY_SHOP 对应）
const isBuiltIn = (role: API.SysRole) => role.roleKey === 'admin' || role.roleKey === 'shop';

// 收集菜单树中所有"有子节点"的 id（父目录）
const collectParentIds = (menus: API.SysMenu[], acc: Set<number> = new Set()): Set<number> => {
  menus.forEach((m) => {
    if (m.children && m.children.length > 0) {
      acc.add(m.id!);
      collectParentIds(m.children, acc);
    }
  });
  return acc;
};

// 回显时只保留叶子节点：antd Tree 会根据叶子自动推导父节点全选/半选。
// 若把父目录 id 也传入 checkedKeys，父子联动会把父节点当作全选，进而勾上其全部子菜单，保存时悄悄扩大权限
const toLeafOnlyIds = (ids: number[], tree: API.SysMenu[]): number[] => {
  const parentIds = collectParentIds(tree);
  return ids.filter((id) => !parentIds.has(id));
};

const RolePage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [modalOpen, setModalOpen] = useState(false);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<API.SysRole | null>(null);
  const [assigningRole, setAssigningRole] = useState<API.SysRole | null>(null);
  const [menuTree, setMenuTree] = useState<API.SysMenu[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<number[]>([]);
  const [halfCheckedKeys, setHalfCheckedKeys] = useState<number[]>([]);
  const [form] = Form.useForm();

  const columns: ProColumns<API.SysRole>[] = [
    { title: 'ID', dataIndex: 'id', width: 60, search: false },
    { title: '角色名称', dataIndex: 'roleName' },
    {
      title: '角色标识',
      dataIndex: 'roleKey',
      render: (_, record) => (
        <>
          {record.roleKey}
          {isBuiltIn(record) && (
            <Tag color="blue" style={{ marginLeft: 8 }}>
              内置
            </Tag>
          )}
        </>
      ),
    },
    { title: '排序', dataIndex: 'sort', search: false, width: 60 },
    {
      title: '状态', dataIndex: 'status', valueEnum: { 0: { text: '正常', status: 'Success' }, 1: { text: '停用', status: 'Error' } },
    },
    { title: '备注', dataIndex: 'remark', search: false, ellipsis: true },
    { title: '创建时间', dataIndex: 'createTime', search: false, valueType: 'dateTime' },
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
        <a key="perm" onClick={async () => {
          setAssigningRole(record);
          const [treeRes, idsRes] = await Promise.all([getMenuTree(), getRoleMenuIds(record.id!)]);
          if (treeRes.code === 200) setMenuTree(treeRes.data || []);
          if (idsRes.code === 200) {
            setCheckedKeys(toLeafOnlyIds(idsRes.data || [], treeRes.data || []));
          }
          setHalfCheckedKeys([]);
          setMenuModalOpen(true);
        }}>分配权限</a>,
        ...(
          // 内置角色不允许删除（后端同样有保护）
          isBuiltIn(record) ? [] : [<Popconfirm key="delete" title="确认删除?" onConfirm={async () => {
            await deleteRole(record.id!);
            message.success('删除成功');
            actionRef.current?.reload();
          }}><a style={{ color: 'red' }}>删除</a></Popconfirm>]
        ),
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
    // 全选节点 + 半选父目录一起提交（半选父目录不提交会导致整个子菜单树从路由中消失）
    await assignMenus(assigningRole!.id!, [...checkedKeys, ...halfCheckedKeys]);
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
      <Modal
        title={`分配菜单权限：${assigningRole?.roleName ?? ''}`}
        open={menuModalOpen}
        onOk={handleAssignMenus}
        onCancel={() => setMenuModalOpen(false)}
        width={500}
      >
        {assigningRole?.roleKey === 'shop' && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
            message="全局内置角色"
            description="所有店铺账号共用此角色，此处的修改会立即影响全部店铺账号的菜单权限。"
          />
        )}
        {assigningRole?.roleKey === 'admin' && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
            message="内置角色"
            description="超级管理员角色为内置角色，修改会影响所有平台管理员账号。"
          />
        )}
        <Tree
          checkable
          defaultExpandAll
          checkedKeys={checkedKeys}
          // 非严格模式下 onCheck 的 keys 只含"全选"节点；半选的父目录单独记录，
          // 提交时与全选节点一起上送（见 handleAssignMenus）
          onCheck={(keys: any, info: any) => {
            setCheckedKeys(Array.isArray(keys) ? keys : keys.checked);
            setHalfCheckedKeys(info.halfCheckedKeys || []);
          }}
          treeData={convertTreeData(menuTree)}
        />
      </Modal>
    </>
  );
};

export default RolePage;
