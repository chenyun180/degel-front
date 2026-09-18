import {
  type ActionType,
  PageContainer,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { Form, Input, Modal, message, Radio, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import {
  arbitrateAfterSale,
  pageArbitrations,
} from '@/services/ant-design-pro/api';

/** 状态语义与 degel-order 状态机对齐（3=退款完成终态；6=待仲裁；7=维持拒绝终态） */
const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '待商家处理', color: 'warning' },
  1: { text: '待买家退货', color: 'processing' },
  2: { text: '待商家收货', color: 'blue' },
  3: { text: '退款完成', color: 'success' },
  5: { text: '已拒绝', color: 'error' },
  6: { text: '平台介入中', color: 'purple' },
  7: { text: '仲裁维持拒绝', color: 'default' },
};

const typeMap: Record<number, string> = { 1: '仅退款', 2: '退货退款' };

const statusTabs = [
  { label: '待仲裁', value: '6' },
  { label: '全部', value: '' },
  { label: '退款完成', value: '3' },
  { label: '维持拒绝', value: '7' },
];

const PlatformAfterSaleArbitrationPage: React.FC = () => {
  const actionRef = useRef<ActionType>(undefined);

  const [activeTab, setActiveTab] = useState('6');
  const [detailOpen, setDetailOpen] = useState(false);
  const [target, setTarget] = useState<API.AfterSaleArbitration | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const handleArbitrate = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const res = await arbitrateAfterSale({
        afterSaleId: target?.id as number,
        supportUser: values.decision === 'support',
        remark: values.remark,
      });
      if (res.code === 200) {
        message.success(
          values.decision === 'support'
            ? '已判定支持用户，退款已执行'
            : '已判定维持拒绝',
        );
        setDetailOpen(false);
        form.resetFields();
        actionRef.current?.reload();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ProColumns<API.AfterSaleArbitration>[] = [
    { title: '售后单号', dataIndex: 'id', width: 80 },
    { title: '订单号', dataIndex: 'orderNo', copyable: true },
    { title: '店铺ID', dataIndex: 'shopId', width: 70 },
    {
      title: '类型',
      dataIndex: 'type',
      width: 90,
      render: (v) => typeMap[v as number] || '-',
    },
    {
      title: '退款金额',
      dataIndex: 'refundAmount',
      width: 90,
      render: (v) => `¥${(v as number)?.toFixed(2)}`,
    },
    { title: '用户原因', dataIndex: 'reason', ellipsis: true },
    { title: '商家备注', dataIndex: 'merchantRemark', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (v) => {
        const s = statusMap[v as number] || { text: '未知', color: 'default' };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    { title: '仲裁意见', dataIndex: 'platformRemark', ellipsis: true },
    {
      title: '申请时间',
      dataIndex: 'createTime',
      valueType: 'dateTime',
      width: 150,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 80,
      render: (_, record) =>
        record.status === 6
          ? [
              <a
                key="arbitrate"
                onClick={() => {
                  setTarget(record);
                  form.setFieldsValue({ decision: 'support' });
                  setDetailOpen(true);
                }}
              >
                仲裁
              </a>,
            ].filter(Boolean)
          : [],
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.AfterSaleArbitration>
        headerTitle="售后仲裁（商家拒绝后用户申请介入的单据）"
        actionRef={actionRef}
        rowKey="id"
        search={false}
        columns={columns}
        toolbar={{
          menu: {
            type: 'tab',
            activeKey: activeTab,
            items: statusTabs.map((t) => ({ key: t.value, label: t.label })),
            onChange: (key) => {
              setActiveTab(key as string);
              actionRef.current?.reload();
            },
          },
        }}
        request={async (params) => {
          const res = await pageArbitrations({
            current: params.current,
            size: params.pageSize,
            status: activeTab || undefined,
          });
          return {
            data: res.data?.records || [],
            total: res.data?.total || 0,
            success: res.code === 200,
          };
        }}
      />

      <Modal
        title={`仲裁判定 - 售后单 ${target?.id || ''}（¥${target?.refundAmount?.toFixed(2) || ''}）`}
        open={detailOpen}
        onOk={handleArbitrate}
        confirmLoading={submitting}
        onCancel={() => {
          setDetailOpen(false);
          form.resetFields();
        }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="decision"
            label="判定结果"
            rules={[{ required: true }]}
          >
            <Radio.Group>
              <Radio value="support">支持用户（执行全额退款）</Radio>
              <Radio value="reject">维持商家拒绝</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            name="remark"
            label="仲裁意见"
            rules={[
              { required: true, message: '仲裁意见必填（会展示给用户）' },
            ]}
          >
            <Input.TextArea rows={3} placeholder="判定依据与处理说明" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default PlatformAfterSaleArbitrationPage;
