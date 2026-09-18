import {
  type ActionType,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Form, Input, Modal, message, Popconfirm, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import {
  confirmAfterSaleReceive,
  getAfterSaleList,
  handleAfterSale,
} from '@/services/ant-design-pro/api';

const typeMap: Record<number, string> = {
  1: '仅退款',
  2: '退货退款',
};

/** 状态语义与 degel-order 状态机对齐（2026-09-18 修正：原映射是早期草稿，从未对齐后端） */
const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '待商家处理', color: 'warning' },
  1: { text: '待买家退货', color: 'processing' },
  2: { text: '待商家收货', color: 'blue' },
  3: { text: '退款完成', color: 'success' },
  5: { text: '已拒绝', color: 'error' },
  6: { text: '平台介入中', color: 'purple' },
  7: { text: '仲裁维持拒绝', color: 'default' },
};

const ShopAfterSalePage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const shopId = initialState?.currentUser?.user?.shopId as number;
  const actionRef = useRef<ActionType>(undefined);

  const [remarkOpen, setRemarkOpen] = useState(false);
  const [remarkAction, setRemarkAction] = useState<'agree' | 'reject'>('agree');
  const [currentId, setCurrentId] = useState<number>(0);
  const [form] = Form.useForm();

  const openRemarkModal = (id: number, action: 'agree' | 'reject') => {
    setCurrentId(id);
    setRemarkAction(action);
    form.resetFields();
    setRemarkOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    await handleAfterSale({
      afterSaleId: currentId,
      action: remarkAction,
      merchantRemark: values.merchantRemark,
    });
    message.success(remarkAction === 'agree' ? '已同意' : '已拒绝');
    setRemarkOpen(false);
    actionRef.current?.reload();
  };

  const columns: ProColumns<API.AfterSale>[] = [
    { title: '售后单号', dataIndex: 'id', width: 80, search: false },
    { title: '关联订单号', dataIndex: 'orderId', width: 100 },
    {
      title: '售后类型',
      dataIndex: 'type',
      search: false,
      width: 100,
      render: (v) => typeMap[v as number] || '未知',
    },
    {
      title: '状态',
      dataIndex: 'status',
      search: false,
      width: 90,
      render: (v) => {
        const s = statusMap[v as number] || { text: '未知', color: 'default' };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '退款金额',
      dataIndex: 'refundAmount',
      search: false,
      width: 100,
      render: (v) =>
        v !== undefined && v !== null ? `¥${(v as number).toFixed(2)}` : '-',
    },
    { title: '原因', dataIndex: 'reason', search: false, ellipsis: true },
    {
      title: '商家备注',
      dataIndex: 'merchantRemark',
      search: false,
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      search: false,
      valueType: 'dateTime',
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) =>
        [
          record.status === 0 && (
            <a
              key="agree"
              onClick={() => openRemarkModal(record.id as number, 'agree')}
            >
              同意
            </a>
          ),
          record.status === 0 && (
            <a
              key="reject"
              style={{ color: 'red' }}
              onClick={() => openRemarkModal(record.id as number, 'reject')}
            >
              拒绝
            </a>
          ),
          record.status === 2 && (
            <Popconfirm
              key="confirm"
              title="确认已收到退回商品?"
              onConfirm={async () => {
                await confirmAfterSaleReceive({
                  afterSaleId: record.id as number,
                });
                message.success('已确认收货，退款已执行');
                actionRef.current?.reload();
              }}
            >
              <a>确认收货</a>
            </Popconfirm>
          ),
        ].filter(Boolean),
    },
  ];

  return (
    <>
      <ProTable<API.AfterSale>
        headerTitle="售后管理"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const res = await getAfterSaleList({
            current: params.current,
            size: params.pageSize,
            shopId,
            orderId: params.orderId,
          });
          return {
            data: res.data?.records || [],
            total: res.data?.total || 0,
            success: res.code === 200,
          };
        }}
      />

      <Modal
        title={remarkAction === 'agree' ? '同意售后' : '拒绝售后'}
        open={remarkOpen}
        onOk={handleSubmit}
        onCancel={() => setRemarkOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="merchantRemark" label="商家备注">
            <Input.TextArea rows={3} placeholder="请输入处理备注" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ShopAfterSalePage;
