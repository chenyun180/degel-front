import {
  type ActionType,
  PageContainer,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { Form, Input, Modal, message, Radio, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import {
  auditPlatformWithdraw,
  pagePlatformWithdraw,
} from '@/services/ant-design-pro/api';

const withdrawStatusMap: Record<number, { text: string; color: string }> = {
  0: { text: '待审核', color: 'processing' },
  1: { text: '已打款', color: 'success' },
  2: { text: '已驳回', color: 'error' },
};

const statusTabs = [
  { label: '全部', value: '' },
  { label: '待审核', value: '0' },
  { label: '已打款', value: '1' },
  { label: '已驳回', value: '2' },
];

const PlatformSettlementWithdrawPage: React.FC = () => {
  const actionRef = useRef<ActionType>(undefined);

  const [activeTab, setActiveTab] = useState('');
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditSubmitting, setAuditSubmitting] = useState(false);
  const [auditTarget, setAuditTarget] = useState<API.SettlementWithdraw | null>(
    null,
  );
  const [auditForm] = Form.useForm();

  const handleAudit = async () => {
    const values = await auditForm.validateFields();
    const approve = values.approve === 'approve';
    setAuditSubmitting(true);
    try {
      const res = await auditPlatformWithdraw({
        withdrawId: auditTarget?.id as number,
        approve,
        auditRemark: values.auditRemark,
      });
      if (res.code === 200) {
        message.success(approve ? '已通过并模拟打款' : '已驳回');
        setAuditOpen(false);
        auditForm.resetFields();
        actionRef.current?.reload();
      }
    } finally {
      setAuditSubmitting(false);
    }
  };

  const columns: ProColumns<API.SettlementWithdraw>[] = [
    { title: '提现单号', dataIndex: 'withdrawNo', copyable: true },
    { title: '店铺ID', dataIndex: 'shopId', search: false, width: 80 },
    {
      title: '金额',
      dataIndex: 'amount',
      search: false,
      width: 100,
      render: (v) => `¥${(v as number).toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      search: false,
      width: 90,
      render: (v) => {
        const s = withdrawStatusMap[v as number] || {
          text: '未知',
          color: 'default',
        };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '申请备注',
      dataIndex: 'applyRemark',
      search: false,
      ellipsis: true,
    },
    {
      title: '审核备注',
      dataIndex: 'auditRemark',
      search: false,
      ellipsis: true,
    },
    { title: '审核人', dataIndex: 'auditBy', search: false, width: 100 },
    {
      title: '打款时间',
      dataIndex: 'payTime',
      search: false,
      valueType: 'dateTime',
      width: 150,
    },
    {
      title: '申请时间',
      dataIndex: 'createTime',
      search: false,
      valueType: 'dateTime',
      width: 150,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 80,
      render: (_, record) =>
        record.status === 0
          ? [
              <a
                key="audit"
                onClick={() => {
                  setAuditTarget(record);
                  auditForm.setFieldsValue({ approve: 'approve' });
                  setAuditOpen(true);
                }}
              >
                审核
              </a>,
            ].filter(Boolean)
          : [],
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.SettlementWithdraw>
        headerTitle="提现审核"
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
          const res = await pagePlatformWithdraw({
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
        title={`提现审核 - ${auditTarget?.withdrawNo || ''}`}
        open={auditOpen}
        onOk={handleAudit}
        confirmLoading={auditSubmitting}
        onCancel={() => {
          setAuditOpen(false);
          auditForm.resetFields();
        }}
        destroyOnClose
      >
        <Form form={auditForm} layout="vertical">
          <Form.Item
            name="approve"
            label="审核结果"
            rules={[{ required: true }]}
          >
            <Radio.Group
              onChange={(e) => {
                // 切到"通过"时清掉驳回备注的必填校验痕迹
                if (e.target.value === 'approve') {
                  auditForm.setFieldValue('auditRemark', undefined);
                }
              }}
            >
              <Radio value="approve">通过（模拟打款）</Radio>
              <Radio value="reject">驳回</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prev, next) => prev.approve !== next.approve}
          >
            {({ getFieldValue }) =>
              getFieldValue('approve') === 'reject' ? (
                <Form.Item
                  name="auditRemark"
                  label="驳回原因"
                  rules={[{ required: true, message: '驳回必须填写原因' }]}
                >
                  <Input.TextArea rows={2} placeholder="请填写驳回原因" />
                </Form.Item>
              ) : (
                <Form.Item name="auditRemark" label="备注">
                  <Input.TextArea rows={2} placeholder="选填" />
                </Form.Item>
              )
            }
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default PlatformSettlementWithdrawPage;
