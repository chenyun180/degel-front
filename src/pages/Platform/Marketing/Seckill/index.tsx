import {
  type ActionType,
  ModalForm,
  type ProColumns,
  ProFormDateTimePicker,
  ProFormDigit,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { Alert, Drawer, message, Popconfirm, Switch } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import React, { useRef, useState } from 'react';
import {
  deleteSeckillProduct,
  deleteSeckillSession,
  getSeckillProductPage,
  getSeckillSessionPage,
  saveSeckillProduct,
  saveSeckillSession,
  toggleSeckillSessionStatus,
} from '@/services/ant-design-pro/api';

// 表单时间值（Dayjs 或字符串）→ 后端 'yyyy-MM-dd HH:mm:ss'（空格格式，同 Banner）
const formatTime = (v?: Dayjs | string | null): string | null => {
  if (!v) return null;
  if (typeof v === 'string') {
    return v.slice(0, 19).replace('T', ' ') || null;
  }
  return v.format('YYYY-MM-DD HH:mm:ss');
};

const asDayjs = (v?: Dayjs | string | null): Dayjs | undefined =>
  typeof v === 'string' ? dayjs(v) : (v ?? undefined);

type SessionFormValues = {
  name?: string;
  startTime?: Dayjs | string | null;
  endTime?: Dayjs | string | null;
  sort?: number;
};

type ProductFormValues = {
  spuId?: number;
  skuId?: number;
  seckillPrice?: number;
  seckillStock?: number;
  perLimit?: number;
  sort?: number;
};

/** 场次商品管理（Drawer 内嵌）：商品表格 + 商品表单，随 Drawer destroyOnClose 整体重置 */
const SessionProducts: React.FC<{ session: API.SeckillSessionItem }> = ({
  session,
}) => {
  const actionRef = useRef<ActionType>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<API.SeckillProductItem | null>(null);

  const doDelete = async (id: string) => {
    const res = await deleteSeckillProduct(id);
    if (res.code === 200) {
      message.success('已删除');
      actionRef.current?.reload();
    } else {
      message.error(res.msg || '删除失败');
    }
  };

  const columns: ProColumns<API.SeckillProductItem>[] = [
    { title: 'spuId', dataIndex: 'spuId', width: 150 },
    { title: 'skuId', dataIndex: 'skuId', width: 150 },
    {
      title: '秒杀价',
      dataIndex: 'seckillPrice',
      width: 100,
      render: (_, r) => `¥${r.seckillPrice}`,
    },
    { title: '秒杀库存', dataIndex: 'seckillStock', width: 90 },
    { title: '限购', dataIndex: 'perLimit', width: 80 },
    { title: '排序', dataIndex: 'sort', width: 70 },
    {
      title: '操作',
      valueType: 'option',
      width: 110,
      render: (_, record) => [
        <a
          key="edit"
          onClick={() => {
            setEditing(record);
            setModalOpen(true);
          }}
        >
          编辑
        </a>,
        <Popconfirm
          key="delete"
          title="确认从该场次移除此商品?"
          onConfirm={() => doDelete(record.id)}
        >
          <a>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProTable<API.SeckillProductItem>
        headerTitle={`场次「${session.name}」的商品`}
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={false}
        options={{ reload: true, density: false, setting: false }}
        toolBarRender={() => [
          <a
            key="create"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            + 新增秒杀商品
          </a>,
        ]}
        request={async (params) => {
          const res = await getSeckillProductPage({
            sessionId: session.id,
            page: params.current,
            pageSize: params.pageSize,
          });
          return {
            data: res.data?.records || [],
            total: res.data?.total || 0,
            success: res.code === 200,
          };
        }}
      />

      <ModalForm<ProductFormValues>
        key={editing?.id ?? 'new'}
        title={`${editing ? '编辑' : '新增'}秒杀商品`}
        width={480}
        open={modalOpen}
        onOpenChange={setModalOpen}
        modalProps={{ destroyOnClose: true }}
        submitter={{
          searchConfig: { submitText: editing ? '保存' : '创建' },
          resetButtonProps: { style: { display: 'none' } },
        }}
        initialValues={
          editing
            ? {
                spuId: Number(editing.spuId),
                skuId: Number(editing.skuId),
                seckillPrice: editing.seckillPrice,
                seckillStock: editing.seckillStock,
                perLimit: editing.perLimit,
                sort: editing.sort,
              }
            : { seckillStock: 0, perLimit: 1, sort: 0 }
        }
        onFinish={async (values) => {
          const res = await saveSeckillProduct({
            id: editing?.id,
            sessionId: session.id,
            spuId: values.spuId ?? 0,
            skuId: values.skuId ?? 0,
            seckillPrice: values.seckillPrice ?? 0,
            seckillStock: values.seckillStock ?? 0,
            perLimit: values.perLimit ?? 1,
            sort: values.sort ?? 0,
          });
          if (res.code === 200) {
            message.success(editing ? '保存成功' : '创建成功');
            actionRef.current?.reload();
            return true;
          }
          message.error(res.msg || (editing ? '保存失败' : '创建失败'));
          return false;
        }}
      >
        <ProFormDigit
          name="spuId"
          label="商品 spuId"
          min={1}
          fieldProps={{ precision: 0 }}
          rules={[{ required: true, message: '请输入商品 spuId' }]}
        />
        <ProFormDigit
          name="skuId"
          label="SKU skuId"
          min={1}
          fieldProps={{ precision: 0 }}
          rules={[{ required: true, message: '请输入 SKU skuId' }]}
        />
        <ProFormDigit
          name="seckillPrice"
          label="秒杀价（元）"
          min={0.01}
          fieldProps={{ precision: 2 }}
          rules={[{ required: true, message: '请输入秒杀价' }]}
        />
        <ProFormDigit
          name="seckillStock"
          label="秒杀库存"
          min={0}
          fieldProps={{ precision: 0 }}
          rules={[{ required: true, message: '请输入秒杀库存' }]}
        />
        <ProFormDigit
          name="perLimit"
          label="每人限购"
          min={1}
          fieldProps={{ precision: 0 }}
          rules={[{ required: true, message: '请输入限购数量' }]}
        />
        <ProFormDigit
          name="sort"
          label="排序（数字小靠前）"
          min={0}
          initialValue={0}
          fieldProps={{ precision: 0 }}
        />
      </ModalForm>
    </>
  );
};

const PlatformSeckillPage: React.FC = () => {
  const actionRef = useRef<ActionType>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<API.SeckillSessionItem | null>(null);
  const [productSession, setProductSession] =
    useState<API.SeckillSessionItem | null>(null);

  const doToggle = async (id: string) => {
    const res = await toggleSeckillSessionStatus(id);
    if (res.code === 200) {
      message.success('状态已更新');
      actionRef.current?.reload();
    } else {
      message.error(res.msg || '操作失败');
    }
  };

  const doDelete = async (id: string) => {
    const res = await deleteSeckillSession(id);
    if (res.code === 200) {
      message.success('已删除');
      actionRef.current?.reload();
    } else {
      message.error(res.msg || '删除失败');
    }
  };

  const columns: ProColumns<API.SeckillSessionItem>[] = [
    { title: '名称', dataIndex: 'name', ellipsis: true },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      search: false,
      valueType: 'dateTime',
      width: 160,
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      search: false,
      valueType: 'dateTime',
      width: 160,
    },
    { title: '排序', dataIndex: 'sort', search: false, width: 70 },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      width: 90,
      valueEnum: new Map([
        [1, { text: '启用' }],
        [0, { text: '停用' }],
      ]),
      render: (_, r) => (
        <Switch
          checked={r.status === 1}
          checkedChildren="启用"
          unCheckedChildren="停用"
          onChange={() => doToggle(r.id)}
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      search: false,
      valueType: 'dateTime',
      width: 160,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      render: (_, record) => [
        <a key="products" onClick={() => setProductSession(record)}>
          管理商品
        </a>,
        <a
          key="edit"
          onClick={() => {
            setEditing(record);
            setModalOpen(true);
          }}
        >
          编辑
        </a>,
        <Popconfirm
          key="delete"
          title="确认删除该场次?（场次下的秒杀商品将一并失效）"
          onConfirm={() => doDelete(record.id)}
        >
          <a>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="新增场次默认为停用状态：创建后需打开状态开关启用场次；开启后约 1 分钟内预热到 Redis 生效。"
      />
      <ProTable<API.SeckillSessionItem>
        headerTitle="秒杀场次管理"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        toolBarRender={() => [
          <a
            key="create"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            + 新建秒杀场次
          </a>,
        ]}
        request={async (params) => {
          // 后端分页参数是 page/pageSize（不是 current/size）
          const res = await getSeckillSessionPage({
            page: params.current,
            pageSize: params.pageSize,
            name: params.name,
            status: params.status,
          });
          return {
            data: res.data?.records || [],
            total: res.data?.total || 0,
            success: res.code === 200,
          };
        }}
      />

      <ModalForm<SessionFormValues>
        key={editing?.id ?? 'new'}
        title={`${editing ? '编辑' : '新建'}秒杀场次`}
        width={520}
        open={modalOpen}
        onOpenChange={setModalOpen}
        modalProps={{ destroyOnClose: true }}
        submitter={{
          searchConfig: { submitText: editing ? '保存' : '创建' },
          resetButtonProps: { style: { display: 'none' } },
        }}
        initialValues={
          editing
            ? {
                name: editing.name,
                sort: editing.sort,
                // 编辑回显：'yyyy-MM-dd HH:mm:ss' 字符串 → Dayjs
                startTime: editing.startTime
                  ? dayjs(editing.startTime)
                  : undefined,
                endTime: editing.endTime ? dayjs(editing.endTime) : undefined,
              }
            : { sort: 0 }
        }
        onFinish={async (values) => {
          const res = await saveSeckillSession({
            id: editing?.id,
            name: (values.name || '').trim(),
            startTime: formatTime(values.startTime) ?? undefined,
            endTime: formatTime(values.endTime) ?? undefined,
            sort: values.sort ?? 0,
          });
          if (res.code === 200) {
            message.success(editing ? '保存成功' : '创建成功（默认停用）');
            actionRef.current?.reload();
            return true;
          }
          message.error(res.msg || (editing ? '保存失败' : '创建失败'));
          return false;
        }}
      >
        <ProFormText
          name="name"
          label="场次名称"
          rules={[
            { required: true, message: '请输入场次名称' },
            { max: 64, message: '名称不能超过64个字符' },
          ]}
          placeholder="如 今晚8点秒杀场"
        />
        <ProFormDateTimePicker
          name="startTime"
          label="开始时间"
          fieldProps={{ allowClear: true }}
          rules={[{ required: true, message: '请选择开始时间' }]}
        />
        <ProFormDateTimePicker
          name="endTime"
          label="结束时间"
          fieldProps={{ allowClear: true }}
          rules={[
            { required: true, message: '请选择结束时间' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                const start = asDayjs(getFieldValue('startTime'));
                const end = asDayjs(value);
                if (start && end && !end.isAfter(start)) {
                  return Promise.reject(new Error('结束时间必须晚于开始时间'));
                }
                return Promise.resolve();
              },
            }),
          ]}
        />
        <ProFormDigit
          name="sort"
          label="排序（数字小靠前）"
          min={0}
          initialValue={0}
          fieldProps={{ precision: 0 }}
        />
      </ModalForm>

      {/* destroyOnClose：关闭时卸载内部商品表格/表单，重新打开按 sessionId 重新加载 */}
      <Drawer
        open={!!productSession}
        onClose={() => setProductSession(null)}
        width={960}
        title={`秒杀商品管理${productSession ? ` - ${productSession.name}` : ''}`}
        destroyOnClose
      >
        {productSession && <SessionProducts session={productSession} />}
      </Drawer>
    </>
  );
};

export default PlatformSeckillPage;
