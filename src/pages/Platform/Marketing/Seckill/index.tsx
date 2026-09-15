import {
  type ActionType,
  ModalForm,
  ProForm,
  type ProColumns,
  ProFormDateTimePicker,
  ProFormDependency,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { Alert, Drawer, message, Popconfirm, Select, Switch } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
import {
  deleteSeckillProduct,
  deleteSeckillSession,
  getSeckillProductPage,
  getSeckillSessionPage,
  getSkuListBySpu,
  getSpuById,
  getSpuList,
  getShopList,
  saveSeckillProduct,
  saveSeckillSession,
  toggleSeckillSessionStatus,
} from '@/services/ant-design-pro/api';

/** specData JSON（如 {"尺码":"M","颜色":"默认"}）→ "尺码:M 颜色:默认" */
const formatSpec = (specData?: string): string => {
  if (!specData) return '';
  try {
    const obj = JSON.parse(specData);
    return Object.entries(obj)
      .map(([k, v]) => `${k}:${v}`)
      .join(' ');
  } catch {
    return specData;
  }
};

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
  shopFilter?: number;
  spuId?: number;
  skuId?: number;
  seckillPrice?: number;
  seckillStock?: number;
  perLimit?: number;
  sort?: number;
};

type SpuOption = { value: number; label: string };

/**
 * 商品远程搜索选择器（关键词防抖 300ms，可按店铺过滤）。
 * 项目首个远程搜索下拉：商品数据量按店铺增长，不适合一次拉全量本地过滤。
 * preset 用于编辑回显——把已选但不在搜索结果里的选项补进列表。
 */
const SpuSearchSelect: React.FC<{
  shopId?: number;
  preset?: SpuOption;
  value?: number;
  onChange?: (value: number) => void;
}> = ({ shopId, preset, value, onChange }) => {
  const [options, setOptions] = useState<SpuOption[]>(preset ? [preset] : []);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presetRef = useRef(preset);
  presetRef.current = preset;

  const doSearch = (keyword: string) => {
    setSearching(true);
    getSpuList({
      current: 1,
      size: 20,
      keyword: keyword || undefined,
      shopId: shopId || undefined,
    })
      .then((res) => {
        const list = (res.data?.records || []).map((s: API.SpuListVo) => ({
          value: Number(s.id),
          label: `${s.name}（¥${s.minPrice ?? '-'}，ID:${s.id}）`,
        }));
        // 编辑回显的选项保底在列（搜索结果可能不含它）
        if (presetRef.current && !list.some((o) => o.value === presetRef.current?.value)) {
          list.unshift(presetRef.current);
        }
        setOptions(list);
      })
      .catch(() => setOptions([]))
      .finally(() => setSearching(false));
  };

  // 店铺切换后清空旧店铺的搜索结果
  useEffect(() => {
    setOptions(preset ? [preset] : []);
  }, [shopId]);

  return (
    <Select
      showSearch
      filterOption={false}
      value={value}
      onChange={onChange}
      placeholder={shopId ? '输入关键词搜索该店铺商品' : '输入关键词搜索全部店铺商品'}
      notFoundContent={searching ? '搜索中...' : '输入关键词搜索商品'}
      options={options}
      onSearch={(kw) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => doSearch(kw.trim()), 300);
      }}
      onClear={() => doSearch('')}
      allowClear
    />
  );
};

/** 场次商品管理（Drawer 内嵌）：商品表格 + 商品表单，随 Drawer destroyOnClose 整体重置 */
const SessionProducts: React.FC<{ session: API.SeckillSessionItem }> = ({
  session,
}) => {
  const actionRef = useRef<ActionType>(undefined);
  const formRef = useRef<any>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<API.SeckillProductItem | null>(null);
  // 编辑回显：已选商品的选项（label 含名称，避免 Select 显示裸 id）
  const [spuPreset, setSpuPreset] = useState<SpuOption | undefined>(undefined);
  // 表格商品名反查缓存（spuId → name，防重复请求）
  const [spuNameMap, setSpuNameMap] = useState<Record<string, string>>({});
  const nameCacheRef = useRef<Record<string, string>>({});

  // 编辑打开时反查商品名做回显选项
  useEffect(() => {
    if (editing?.spuId && modalOpen) {
      const id = String(editing.spuId);
      if (nameCacheRef.current[id]) {
        setSpuPreset({ value: Number(id), label: `${nameCacheRef.current[id]}（ID:${id}）` });
        return;
      }
      getSpuById(Number(id))
        .then((res: any) => {
          const name = res.data?.name || res.data?.spu?.name;
          if (name) {
            nameCacheRef.current[id] = name;
            setSpuPreset({ value: Number(id), label: `${name}（ID:${id}）` });
          } else {
            setSpuPreset({ value: Number(id), label: `ID:${id}` });
          }
        })
        .catch(() => setSpuPreset({ value: Number(id), label: `ID:${id}` }));
    } else if (!modalOpen) {
      setSpuPreset(undefined);
    }
  }, [modalOpen, editing]);

  const doDelete = async (id: string) => {
    const res = await deleteSeckillProduct(id);
    if (res.code === 200) {
      message.success('已删除');
      actionRef.current?.reload();
    } else {
      message.error(res.msg || '删除失败');
    }
  };

  // 列表加载后反查商品名（每页 ≤10 条，命中缓存的跳过）
  const ensureSpuNames = async (records: API.SeckillProductItem[]) => {
    const missing = [...new Set(records.map((r) => String(r.spuId)))].filter(
      (id) => !nameCacheRef.current[id],
    );
    if (missing.length === 0) return;
    await Promise.all(
      missing.map((id) =>
        getSpuById(Number(id))
          .then((res: any) => {
            const name = res.data?.name || res.data?.spu?.name;
            if (name) nameCacheRef.current[id] = name;
          })
          .catch(() => {}),
      ),
    );
    setSpuNameMap({ ...nameCacheRef.current });
  };

  const columns: ProColumns<API.SeckillProductItem>[] = [
    {
      title: '商品',
      dataIndex: 'spuId',
      width: 200,
      render: (_, r) =>
        spuNameMap[r.spuId]
          ? `${spuNameMap[r.spuId]}（ID:${r.spuId}）`
          : `ID:${r.spuId}`,
    },
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
          const records = res.data?.records || [];
          ensureSpuNames(records);
          return {
            data: records,
            total: res.data?.total || 0,
            success: res.code === 200,
          };
        }}
      />

      <ModalForm<ProductFormValues>
        key={editing?.id ?? 'new'}
        title={`${editing ? '编辑' : '新增'}秒杀商品`}
        width={520}
        open={modalOpen}
        onOpenChange={setModalOpen}
        formRef={formRef}
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
        {/* 店铺筛选（仅辅助商品搜索，不提交） */}
        <ProFormSelect
          name="shopFilter"
          label="店铺（可选，缩小搜索范围）"
          showSearch
          allowClear
          request={async () => {
            const res = await getShopList({ current: 1, size: 500 });
            return (res.data?.records || [])
              .filter((s) => s.status === 0)
              .map((s) => ({
                value: Number(s.id),
                label: `${s.shopName}（ID:${s.id}）`,
              }));
          }}
          fieldProps={{ optionFilterProp: 'label' }}
        />
        {/* 商品远程搜索：依赖店铺筛选值，切换店铺重置选项 */}
        <ProFormDependency name={['shopFilter']}>
          {({ shopFilter }) => (
            <ProForm.Item
              name="spuId"
              label="商品"
              rules={[{ required: true, message: '请搜索并选择商品' }]}
            >
              <SpuSearchSelect shopId={shopFilter} preset={spuPreset} />
            </ProForm.Item>
          )}
        </ProFormDependency>
        {/* SKU 联动：选完商品才可选规格；key 强制随商品重挂载刷新选项 */}
        <ProFormDependency name={['spuId']}>
          {({ spuId }) => (
            <ProFormSelect
              key={spuId || 'none'}
              name="skuId"
              label="SKU（规格）"
              disabled={!spuId}
              placeholder={spuId ? '请选择规格' : '请先选择商品'}
              rules={[{ required: true, message: '请选择 SKU 规格' }]}
              request={async () => {
                if (!spuId) return [];
                const res = await getSkuListBySpu(spuId);
                return (res.data || []).map((sku) => ({
                  value: Number(sku.id),
                  label: `${formatSpec(sku.specData) || sku.skuName || sku.id}（¥${sku.price ?? '-'} 库存${sku.stock ?? 0}）`,
                  disabled: sku.status !== 1,
                  skuPrice: sku.price,
                }));
              }}
              fieldProps={{
                onSelect: (_v: any, option: any) => {
                  // 选中 SKU 自动带出原价作秒杀价建议（用户未填时）
                  if (
                    option?.skuPrice != null &&
                    !formRef.current?.getFieldValue?.('seckillPrice')
                  ) {
                    formRef.current?.setFieldValue?.(
                      'seckillPrice',
                      option.skuPrice,
                    );
                  }
                },
              }}
            />
          )}
        </ProFormDependency>
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
