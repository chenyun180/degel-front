import { ActionType, ProColumns, ProTable } from '@ant-design/pro-components';
import { Input, message, Modal, Popconfirm, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import { auditSpu, getSpuList } from '@/services/ant-design-pro/api';

const auditStatusMap: Record<number, { text: string; color: string }> = {
  0: { text: '草稿', color: 'default' },
  1: { text: '待审核', color: 'processing' },
  2: { text: '已通过', color: 'success' },
  3: { text: '已驳回', color: 'error' },
};

const formatCurrency = (value: unknown) => {
  if (value === undefined || value === null || value === '') {
    return '-';
  }

  const amount = Number(value);
  return Number.isFinite(amount) ? `¥${amount.toFixed(2)}` : '-';
};

const ProductAuditPage: React.FC = () => {
  const actionRef = useRef<ActionType>(undefined);
  const [rejectTarget, setRejectTarget] = useState<API.SpuListVo | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const doAudit = async (spuId: number, passed: boolean, rejectReason?: string) => {
    setSubmitting(true);
    try {
      await auditSpu({ spuId, passed, rejectReason });
      message.success(passed ? '已通过' : '已驳回');
      actionRef.current?.reload();
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ProColumns<API.SpuListVo>[] = [
    { title: 'ID', dataIndex: 'id', width: 60, search: false },
    { title: '商品名称', dataIndex: 'name' },
    { title: '店铺ID', dataIndex: 'shopId', search: false, width: 80 },
    {
      title: '最低价',
      dataIndex: 'minPrice',
      search: false,
      width: 90,
      render: (v) => formatCurrency(v),
    },
    {
      title: '审核状态',
      dataIndex: 'auditStatus',
      valueType: 'select',
      // 用 Map 保留数字 key，与 initialValues 的数字 1 匹配（对象字面量的 key 是字符串，会导致初始值显示为数字）
      valueEnum: new Map([
        [1, { text: '待审核' }],
        [2, { text: '已通过' }],
        [3, { text: '已驳回' }],
      ]),
      width: 90,
      render: (_, record) => {
        const s = auditStatusMap[record.auditStatus] || { text: '未知', color: 'default' };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '驳回理由',
      dataIndex: 'rejectReason',
      search: false,
      ellipsis: true,
      render: (v, record) =>
        record.auditStatus === 3 ? <span style={{ color: 'red' }}>{v}</span> : '-',
    },
    { title: '创建时间', dataIndex: 'createTime', search: false, valueType: 'dateTime' },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) =>
        [
          record.auditStatus === 1 ? (
            <Popconfirm
              key="pass"
              title="确认通过该商品?"
              onConfirm={() => doAudit(record.id, true)}
            >
              <a>通过</a>
            </Popconfirm>
          ) : null,
          record.auditStatus === 1 ? (
            <a
              key="reject"
              onClick={() => {
                setRejectTarget(record);
                setRejectReason('');
              }}
            >
              驳回
            </a>
          ) : null,
        ].filter(Boolean),
    },
  ];

  return (
    <>
      <ProTable<API.SpuListVo>
        headerTitle="商品审核"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        form={{ initialValues: { auditStatus: 1 } }}
        locale={{ emptyText: '暂无符合条件的商品（默认只展示"待审核"，可切换筛选条件）' }}
        request={async (params) => {
          const res = await getSpuList({
            current: params.current,
            size: params.pageSize,
            name: params.name,
            auditStatus: params.auditStatus,
          });
          return {
            data: res.data?.records || [],
            total: res.data?.total || 0,
            success: res.code === 200,
          };
        }}
      />
      <Modal
        title={`驳回商品：${rejectTarget?.name ?? ''}`}
        open={!!rejectTarget}
        confirmLoading={submitting}
        onOk={async () => {
          if (!rejectReason.trim()) {
            message.warning('请填写驳回理由');
            return;
          }
          await doAudit(rejectTarget!.id, false, rejectReason.trim());
          setRejectTarget(null);
        }}
        onCancel={() => setRejectTarget(null)}
      >
        <Input.TextArea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="驳回理由（必填）"
          maxLength={200}
          showCount
        />
      </Modal>
    </>
  );
};

export default ProductAuditPage;
