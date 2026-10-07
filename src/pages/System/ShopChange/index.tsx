import {
  type ActionType,
  PageContainer,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import {
  Form,
  Input,
  Modal,
  message,
  Radio,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import React, { useRef, useState } from 'react';
import FlowDiagram from '@/components/FlowDiagram';
import {
  auditShopChange,
  getShopChangeDiagram,
  pageShopChanges,
} from '@/services/ant-design-pro/api';

/** 与后端 SysShopChange.STATUS_* 对齐 */
const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '待审核', color: 'warning' },
  1: { text: '已通过', color: 'success' },
  2: { text: '已驳回', color: 'error' },
  3: { text: '已撤回', color: 'default' },
};

const statusTabs = [
  { label: '待审核', value: '0' },
  { label: '全部', value: '' },
  { label: '已通过', value: '1' },
  { label: '已驳回', value: '2' },
  { label: '已撤回', value: '3' },
];

const fieldLabels: Record<keyof API.ShopProfile, string> = {
  shopName: '店铺名称',
  logo: '店铺Logo',
  announcement: '店铺公告',
  description: '店铺描述',
  contactName: '联系人',
  contactPhone: '联系电话',
};

type DiffRow = {
  field: string;
  label: string;
  before: string;
  after: string;
  changed: boolean;
};

const parseProfile = (json?: string): API.ShopProfile => {
  try {
    return json ? JSON.parse(json) : {};
  } catch {
    return {};
  }
};

const buildDiff = (record: API.SysShopChange): DiffRow[] => {
  const before = parseProfile(record.beforeData);
  const after = parseProfile(record.afterData);
  return (Object.keys(fieldLabels) as (keyof API.ShopProfile)[]).map((k) => ({
    field: k,
    label: fieldLabels[k],
    before: before[k] || '',
    after: after[k] || '',
    changed: (before[k] || '') !== (after[k] || ''),
  }));
};

const ShopChangeAuditPage: React.FC = () => {
  const actionRef = useRef<ActionType>(undefined);
  const [activeTab, setActiveTab] = useState('0');
  const [target, setTarget] = useState<API.SysShopChange | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const closeModal = () => {
    setTarget(null);
    form.resetFields();
  };

  const handleAudit = async () => {
    if (!target) return;
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const approved = values.decision === 'approve';
      const res = await auditShopChange(target.id, {
        approved,
        remark: values.remark,
      });
      if (res.code === 200) {
        message.success(approved ? '已通过，店铺资料已更新' : '已驳回');
        closeModal();
        actionRef.current?.reload();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ProColumns<API.SysShopChange>[] = [
    { title: '申请ID', dataIndex: 'id', width: 80 },
    { title: '店铺ID', dataIndex: 'shopId', width: 70 },
    {
      title: '店铺名（申请时）',
      dataIndex: 'shopName',
      width: 180,
      ellipsis: true,
    },
    {
      title: '变更字段',
      key: 'changedFields',
      width: 220,
      render: (_, record) =>
        buildDiff(record)
          .filter((d) => d.changed)
          .map((d) => <Tag key={d.field}>{d.label}</Tag>),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v) => {
        const s = statusMap[v as number] || { text: '未知', color: 'default' };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    { title: '审批意见', dataIndex: 'auditRemark', width: 200, ellipsis: true },
    {
      title: '提交时间',
      dataIndex: 'createTime',
      valueType: 'dateTime',
      width: 160,
    },
    {
      title: '审批时间',
      dataIndex: 'auditTime',
      valueType: 'dateTime',
      width: 160,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 80,
      render: (_, record) => [
        <a
          key="view"
          onClick={() => {
            setTarget(record);
            form.setFieldsValue({ decision: 'approve' });
          }}
        >
          {record.status === 0 ? '审批' : '查看'}
        </a>,
      ],
    },
  ];

  const isPending = target?.status === 0;

  return (
    <PageContainer>
      <ProTable<API.SysShopChange>
        headerTitle="店铺资料变更审批"
        actionRef={actionRef}
        rowKey="id"
        search={false}
        scroll={{ x: 1300 }}
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
          const res = await pageShopChanges({
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
        title={`资料变更 - ${target?.shopName || ''}（申请 ${target?.id || ''}）`}
        open={!!target}
        width={820}
        onCancel={closeModal}
        onOk={isPending ? handleAudit : closeModal}
        okText={isPending ? '提交审批' : '关闭'}
        cancelButtonProps={
          isPending ? undefined : { style: { display: 'none' } }
        }
        confirmLoading={submitting}
        destroyOnHidden
      >
        {target && (
          <Tabs
            size="small"
            style={{ marginBottom: 8 }}
            items={[
              {
                key: 'diff',
                label: '资料对比',
                children: (
                  <Table<DiffRow>
                    size="small"
                    rowKey="field"
                    pagination={false}
                    dataSource={buildDiff(target)}
                    columns={[
                      { title: '字段', dataIndex: 'label', width: 90 },
                      { title: '变更前', dataIndex: 'before' },
                      {
                        title: '变更后',
                        dataIndex: 'after',
                        render: (v, row) =>
                          row.changed ? (
                            <Typography.Text type="danger" strong>
                              {v || '（清空）'}
                            </Typography.Text>
                          ) : (
                            v
                          ),
                      },
                    ]}
                  />
                ),
              },
              {
                key: 'flow',
                label: '流程进度',
                // Tabs 首次激活才挂载，bpmn-js 需要可见容器才能正确 fit-viewport
                children: (
                  <FlowDiagram
                    key={target.id}
                    load={() => getShopChangeDiagram(target.id)}
                  />
                ),
              },
            ]}
          />
        )}
        {isPending ? (
          <Form form={form} layout="vertical">
            <Form.Item
              name="decision"
              label="审批结果"
              rules={[{ required: true }]}
            >
              <Radio.Group>
                <Radio value="approve">通过（立即更新店铺资料）</Radio>
                <Radio value="reject">驳回</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item
              noStyle
              shouldUpdate={(p, c) => p.decision !== c.decision}
            >
              {({ getFieldValue }) => (
                <Form.Item
                  name="remark"
                  label="审批意见"
                  rules={[
                    {
                      required: getFieldValue('decision') === 'reject',
                      message: '驳回必须填写原因（店铺可见）',
                    },
                    { max: 500 },
                  ]}
                >
                  <Input.TextArea rows={3} placeholder="驳回原因会展示给店铺" />
                </Form.Item>
              )}
            </Form.Item>
          </Form>
        ) : (
          target && (
            <Typography.Paragraph type="secondary">
              {statusMap[target.status]?.text}
              {target.auditTime ? ` · ${target.auditTime}` : ''}
              {target.auditRemark ? ` · 意见：${target.auditRemark}` : ''}
            </Typography.Paragraph>
          )
        )}
      </Modal>
    </PageContainer>
  );
};

export default ShopChangeAuditPage;
