import { PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, InputNumber, message, Modal, Popconfirm, Select, Table, Tag, TreeSelect } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';
import { getMenuList, createMenu, updateMenu, deleteMenu } from '@/services/ant-design-pro/api';

const menuTypeMap: Record<string, { label: string; color: string }> = {
  M: { label: '目录', color: 'blue' },
  C: { label: '菜单', color: 'green' },
  F: { label: '按钮', color: 'orange' },
};

const MenuPage: React.FC = () => {
  const [data, setData] = useState<API.SysMenu[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<API.SysMenu | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    const res = await getMenuList();
    if (res.code === 200) setData(res.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const columns: ColumnsType<API.SysMenu> = [
    { title: '菜单名称', dataIndex: 'menuName', width: 200 },
    { title: '图标', dataIndex: 'icon', width: 100 },
    {
      title: '类型', dataIndex: 'menuType', width: 80,
      render: (v: string) => <Tag color={menuTypeMap[v]?.color}>{menuTypeMap[v]?.label}</Tag>,
    },
    { title: '路由地址', dataIndex: 'path', width: 160 },
    { title: '组件路径', dataIndex: 'component', width: 200 },
    { title: '权限标识', dataIndex: 'perms', width: 180 },
    { title: '排序', dataIndex: 'sort', width: 60 },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (v: number) => <Tag color={v === 0 ? 'green' : 'red'}>{v === 0 ? '正常' : '停用'}</Tag>,
    },
    {
      title: '操作', width: 180,
      render: (_, record) => (
        <>
          <a onClick={() => { setEditingMenu(record); form.setFieldsValue(record); setModalOpen(true); }}>编辑</a>
          <a style={{ marginLeft: 8 }} onClick={() => { form.resetFields(); form.setFieldsValue({ parentId: record.id, menuType: 'C' }); setEditingMenu(null); setModalOpen(true); }}>新增子菜单</a>
          <Popconfirm title="确认删除?" onConfirm={async () => { await deleteMenu(record.id!); message.success('删除成功'); fetchData(); }}>
            <a style={{ marginLeft: 8, color: 'red' }}>删除</a>
          </Popconfirm>
        </>
      ),
    },
  ];

  const handleOk = async () => {
    const values = await form.validateFields();
    if (editingMenu?.id) {
      await updateMenu({ ...values, id: editingMenu.id });
      message.success('修改成功');
    } else {
      await createMenu(values);
      message.success('创建成功');
    }
    setModalOpen(false);
    form.resetFields();
    setEditingMenu(null);
    fetchData();
  };

  const flatToTreeSelect = (menus: API.SysMenu[]): any[] =>
    menus.map((m) => ({
      value: m.id, title: m.menuName,
      children: m.children ? flatToTreeSelect(m.children) : [],
    }));

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setEditingMenu(null); form.resetFields(); form.setFieldsValue({ parentId: 0, menuType: 'M' }); setModalOpen(true);
        }}>新增菜单</Button>
      </div>
      <Table<API.SysMenu>
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={false}
        defaultExpandAllRows
        childrenColumnName="children"
      />
      <Modal title={editingMenu ? '编辑菜单' : '新增菜单'} open={modalOpen} onOk={handleOk}
        onCancel={() => { setModalOpen(false); form.resetFields(); setEditingMenu(null); }} destroyOnClose width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="parentId" label="上级菜单" initialValue={0}>
            <TreeSelect treeData={[{ value: 0, title: '顶级菜单', children: flatToTreeSelect(data) }]}
              treeDefaultExpandAll placeholder="请选择上级菜单" />
          </Form.Item>
          <Form.Item name="menuType" label="菜单类型" rules={[{ required: true }]}>
            <Select options={[{ label: '目录', value: 'M' }, { label: '菜单', value: 'C' }, { label: '按钮', value: 'F' }]} />
          </Form.Item>
          <Form.Item name="menuName" label="菜单名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="sort" label="排序" initialValue={0}><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.menuType !== cur.menuType}>
            {({ getFieldValue }) =>
              getFieldValue('menuType') !== 'F' ? (
                <>
                  <Form.Item name="icon" label="图标"><Input placeholder="例如: UserOutlined" /></Form.Item>
                  <Form.Item name="path" label="路由地址"><Input /></Form.Item>
                  {getFieldValue('menuType') === 'C' && <Form.Item name="component" label="组件路径"><Input placeholder="例如: ./System/User" /></Form.Item>}
                </>
              ) : null
            }
          </Form.Item>
          <Form.Item name="perms" label="权限标识"><Input placeholder="例如: system:user:list" /></Form.Item>
          <Form.Item name="visible" label="是否显示" initialValue={0}>
            <Select options={[{ label: '显示', value: 0 }, { label: '隐藏', value: 1 }]} />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue={0}>
            <Select options={[{ label: '正常', value: 0 }, { label: '停用', value: 1 }]} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default MenuPage;
