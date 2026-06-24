import {
  HeartOutlined,
  ManOutlined,
  PlusOutlined,
  SkinOutlined,
  SmileOutlined,
  TagOutlined,
  WomanOutlined,
} from '@ant-design/icons';
import { Button, Form, Input, InputNumber, message, Modal, Popconfirm, Select, Table, Tag, TreeSelect } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';
import { createCategory, deleteCategory, getCategoryTree, updateCategory } from '@/services/ant-design-pro/api';

const ICON_MAP: Record<string, React.ReactNode> = {
  SkinOutlined: <SkinOutlined />,
  ManOutlined: <ManOutlined />,
  WomanOutlined: <WomanOutlined />,
  SmileOutlined: <SmileOutlined />,
  HeartOutlined: <HeartOutlined />,
  TagOutlined: <TagOutlined />,
};

const ICON_OPTIONS = [
  { label: 'SkinOutlined（服装）', value: 'SkinOutlined' },
  { label: 'ManOutlined（男）', value: 'ManOutlined' },
  { label: 'WomanOutlined（女）', value: 'WomanOutlined' },
  { label: 'SmileOutlined（童）', value: 'SmileOutlined' },
  { label: 'HeartOutlined（内衣）', value: 'HeartOutlined' },
  { label: 'TagOutlined（通用）', value: 'TagOutlined' },
];

const normalizeCategories = (
  items: API.ProductCategory[] = [],
): API.ProductCategory[] =>
  items.map((item) => {
    const children = normalizeCategories(item.children || []);
    return {
      ...item,
      children: children.length > 0 ? children : undefined,
    };
  });

const CategoryPage: React.FC = () => {
  const [data, setData] = useState<API.ProductCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<API.ProductCategory | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getCategoryTree();
      if (res.code === 200) setData(normalizeCategories(res.data || []));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = (parentId?: number) => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ parentId: parentId ?? 0, sort: 1, status: 0, icon: 'TagOutlined' });
    setModalOpen(true);
  };

  const openEdit = (record: API.ProductCategory) => {
    setEditing(record);
    form.setFieldsValue({ ...record });
    setModalOpen(true);
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    if (editing?.id) {
      await updateCategory({ ...values, id: editing.id });
      message.success('修改成功');
    } else {
      await createCategory(values);
      message.success('新增成功');
    }
    setModalOpen(false);
    form.resetFields();
    setEditing(null);
    fetchData();
  };

  const handleDelete = async (id: number) => {
    await deleteCategory(id);
    message.success('删除成功');
    fetchData();
  };

  const treeSelectData = (items: API.ProductCategory[]): any[] =>
    items.map((item) => ({
      value: item.id,
      title: item.name,
      children: item.children ? treeSelectData(item.children) : [],
    }));

  const columns: ColumnsType<API.ProductCategory> = [
    {
      title: '分类名称',
      dataIndex: 'name',
      render: (name: string, record) => (
        <span>
          {record.icon && ICON_MAP[record.icon] && (
            <span style={{ marginRight: 6, color: '#1890ff' }}>{ICON_MAP[record.icon]}</span>
          )}
          {name}
        </span>
      ),
    },
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '排序', dataIndex: 'sort', width: 70 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (v: number) => (
        <Tag color={v === 0 ? 'green' : 'red'}>{v === 0 ? '启用' : '停用'}</Tag>
      ),
    },
    {
      title: '操作',
      width: 220,
      render: (_, record) => (
        <>
          <a onClick={() => openEdit(record)}>编辑</a>
          <a style={{ marginLeft: 8 }} onClick={() => openCreate(record.id)}>
            新增子分类
          </a>
          <Popconfirm
            title="确认删除该分类？子分类存在时无法删除。"
            onConfirm={() => handleDelete(record.id!)}
          >
            <a style={{ marginLeft: 8, color: 'red' }}>删除</a>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate()}>
          新增分类
        </Button>
      </div>
      <Table<API.ProductCategory>
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={false}
        defaultExpandAllRows
        childrenColumnName="children"
        expandable={{
          columnWidth: 40,
          rowExpandable: (record) =>
            Array.isArray(record.children) && record.children.length > 0,
        }}
      />
      <Modal
        title={editing ? '编辑分类' : '新增分类'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setEditing(null);
        }}
        destroyOnClose
        width={480}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="parentId" label="上级分类" initialValue={0}>
            <TreeSelect
              treeData={[{ value: 0, title: '顶级分类', children: treeSelectData(data) }]}
              treeDefaultExpandAll
              placeholder="请选择上级分类"
            />
          </Form.Item>
          <Form.Item name="name" label="分类名称" rules={[{ required: true, message: '请输入分类名称' }]}>
            <Input placeholder="例如：男装" />
          </Form.Item>
          <Form.Item name="sort" label="排序" initialValue={1}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="icon" label="图标" initialValue="TagOutlined">
            <Select
              options={ICON_OPTIONS}
              optionRender={(option) => (
                <span>
                  {ICON_MAP[option.value as string]}
                  <span style={{ marginLeft: 8 }}>{option.label}</span>
                </span>
              )}
            />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue={0}>
            <Select
              options={[
                { label: '启用', value: 0 },
                { label: '停用', value: 1 },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default CategoryPage;
