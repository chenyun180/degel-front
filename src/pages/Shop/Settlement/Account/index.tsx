import {
  type ActionType,
  PageContainer,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  message,
  Row,
  Statistic,
  Tag,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import {
  applyShopWithdraw,
  getShopSettlementAccount,
  pageShopSettlementDetail,
  pageShopSettlementWithdraw,
} from '@/services/ant-design-pro/api';

const detailStatusMap: Record<number, { text: string; color: string }> = {
  0: { text: '待入账', color: 'processing' },
  1: { text: '已入账', color: 'success' },
  2: { text: '已扣回', color: 'warning' },
};

const withdrawStatusMap: Record<number, { text: string; color: string }> = {
  0: { text: '待审核', color: 'processing' },
  1: { text: '已打款', color: 'success' },
  2: { text: '已驳回', color: 'error' },
};

const detailTabs = [
  { label: '全部', value: '' },
  { label: '待入账', value: '0' },
  { label: '已入账', value: '1' },
  { label: '已扣回', value: '2' },
];

const money = (v: unknown) =>
  v === undefined || v === null ? '-' : `¥${(v as number).toFixed(2)}`;

const ShopSettlementAccountPage: React.FC = () => {
  const actionRef = useRef<ActionType>(undefined);
  const withdrawActionRef = useRef<ActionType>(undefined);

  const [account, setAccount] = useState<API.ShopSettlementAccount | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState('');
  const [applyOpen, setApplyOpen] = useState(false);
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applyForm] = Form.useForm();

  const loadAccount = async () => {
    const res = await getShopSettlementAccount();
    if (res.code === 200) {
      setAccount(res.data);
    }
  };

  useEffect(() => {
    loadAccount();
  }, []);

  const handleApply = async () => {
    const values = await applyForm.validateFields();
    setApplySubmitting(true);
    try {
      const res = await applyShopWithdraw({
        amount: values.amount,
        applyRemark: values.applyRemark,
      });
      if (res.code === 200) {
        message.success('提现申请已提交，等待平台审核');
        setApplyOpen(false);
        applyForm.resetFields();
        loadAccount();
        withdrawActionRef.current?.reload();
      }
    } finally {
      setApplySubmitting(false);
    }
  };

  const detailColumns: ProColumns<API.SettlementOrder>[] = [
    { title: '订单号', dataIndex: 'orderNo', copyable: true },
    {
      title: '商品总额',
      dataIndex: 'payAmount',
      search: false,
      width: 90,
      render: money,
    },
    {
      title: '基数',
      dataIndex: 'grossAmount',
      search: false,
      width: 90,
      render: money,
      tooltip: '实付+平台承担券+积分抵扣',
    },
    {
      title: '佣金',
      dataIndex: 'commissionAmount',
      search: false,
      width: 90,
      render: (_, record) =>
        `${money(record.commissionAmount)}（${record.commissionRate}%）`,
    },
    {
      title: '入账金额',
      dataIndex: 'netAmount',
      search: false,
      width: 90,
      render: money,
    },
    {
      title: '状态',
      dataIndex: 'status',
      search: false,
      width: 90,
      render: (v) => {
        const s = detailStatusMap[v as number] || {
          text: '未知',
          color: 'default',
        };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '入账时间',
      dataIndex: 'settleTime',
      search: false,
      valueType: 'dateTime',
      width: 150,
    },
  ];

  const withdrawColumns: ProColumns<API.SettlementWithdraw>[] = [
    { title: '提现单号', dataIndex: 'withdrawNo', copyable: true },
    {
      title: '金额',
      dataIndex: 'amount',
      search: false,
      width: 100,
      render: money,
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
  ];

  return (
    <PageContainer title={false}>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={24} align="middle">
          <Col span={6}>
            <Statistic
              title="可提现余额"
              value={account?.balance ?? 0}
              precision={2}
              prefix="¥"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="累计结算"
              value={account?.totalSettled ?? 0}
              precision={2}
              prefix="¥"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="累计提现"
              value={account?.totalWithdrawn ?? 0}
              precision={2}
              prefix="¥"
            />
          </Col>
          <Col span={6} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              onClick={() => setApplyOpen(true)}
              disabled={(account?.balance ?? 0) <= 0}
            >
              申请提现
            </Button>
          </Col>
        </Row>
      </Card>

      <ProTable<API.SettlementOrder>
        headerTitle="结算明细（确认收货 7 天后自动入账）"
        actionRef={actionRef}
        rowKey="id"
        search={false}
        columns={detailColumns}
        toolbar={{
          menu: {
            type: 'tab',
            activeKey: activeTab,
            items: detailTabs.map((t) => ({ key: t.value, label: t.label })),
            onChange: (key) => {
              setActiveTab(key as string);
              actionRef.current?.reload();
            },
          },
        }}
        request={async (params) => {
          const res = await pageShopSettlementDetail({
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
        pagination={{ defaultPageSize: 10 }}
      />

      <ProTable<API.SettlementWithdraw>
        headerTitle="提现记录"
        actionRef={withdrawActionRef}
        rowKey="id"
        search={false}
        columns={withdrawColumns}
        request={async (params) => {
          const res = await pageShopSettlementWithdraw({
            current: params.current,
            size: params.pageSize,
          });
          return {
            data: res.data?.records || [],
            total: res.data?.total || 0,
            success: res.code === 200,
          };
        }}
        pagination={{ defaultPageSize: 10 }}
        style={{ marginTop: 16 }}
      />

      <Modal
        title="申请提现"
        open={applyOpen}
        onOk={handleApply}
        confirmLoading={applySubmitting}
        onCancel={() => {
          setApplyOpen(false);
          applyForm.resetFields();
        }}
        destroyOnClose
      >
        <Form form={applyForm} layout="vertical">
          <Form.Item
            name="amount"
            label="提现金额"
            rules={[
              { required: true, message: '请输入提现金额' },
              {
                validator: (_, value) =>
                  value !== undefined && value > (account?.balance ?? 0)
                    ? Promise.reject(new Error('金额不能超过可提现余额'))
                    : Promise.resolve(),
              },
            ]}
          >
            <InputNumber
              min={0.01}
              max={account?.balance ?? 0}
              precision={2}
              style={{ width: '100%' }}
              placeholder={`最多可提现 ¥${(account?.balance ?? 0).toFixed(2)}`}
            />
          </Form.Item>
          <Form.Item name="applyRemark" label="备注">
            <Input.TextArea placeholder="选填" rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ShopSettlementAccountPage;
