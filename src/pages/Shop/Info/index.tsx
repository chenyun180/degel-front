import { PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Modal,
  message,
  Popconfirm,
  Row,
  Space,
  Spin,
} from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import FlowDiagram from '@/components/FlowDiagram';
import {
  getLatestShopChange,
  getMyShop,
  getMyShopChangeDiagram,
  submitShopChange,
  withdrawShopChange,
} from '@/services/ant-design-pro/api';

const { TextArea } = Input;

const ShopInfoPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [latest, setLatest] = useState<API.SysShopChange | null>(null);
  const [diagramOpen, setDiagramOpen] = useState(false);

  // 资料变更走平台审批：待审核期间表单回显申请中的内容并锁定，避免误以为已生效
  const pending = latest?.status === 0;

  const load = async () => {
    setLoading(true);
    try {
      const [shopRes, changeRes] = await Promise.all([
        getMyShop(),
        getLatestShopChange(),
      ]);
      const change = changeRes.code === 200 ? (changeRes.data ?? null) : null;
      setLatest(change);
      if (shopRes.code === 200 && shopRes.data) {
        const profile: API.ShopProfile =
          change?.status === 0 && change.afterData
            ? JSON.parse(change.afterData)
            : shopRes.data;
        form.setFieldsValue({
          ...profile,
          expireTime: shopRes.data.expireTime
            ? dayjs(shopRes.data.expireTime)
            : undefined,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const { expireTime, ...submitData } = values;
    setSaving(true);
    try {
      const res = await submitShopChange(submitData);
      if (res.code === 200) {
        message.success('已提交审核，平台审核通过后生效');
        await load();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleWithdraw = async () => {
    if (!latest) return;
    const res = await withdrawShopChange(latest.id);
    if (res.code === 200) {
      message.success('已撤回');
      await load();
    }
  };

  const renderStatus = () => {
    if (!latest) return null;
    if (latest.status === 0) {
      return (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          title={`资料变更审核中（提交于 ${latest.createTime}），审核通过后生效`}
          action={
            <Space>
              <Button size="small" onClick={() => setDiagramOpen(true)}>
                查看审批进度
              </Button>
              <Popconfirm
                title="确认撤回本次变更申请？"
                onConfirm={handleWithdraw}
              >
                <Button size="small">撤回</Button>
              </Popconfirm>
            </Space>
          }
        />
      );
    }
    if (latest.status === 2) {
      return (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          title={`上次资料变更被驳回（${latest.auditTime}）`}
          description={`驳回原因：${latest.auditRemark || '-'}`}
          action={
            <Button size="small" onClick={() => setDiagramOpen(true)}>
              查看审批进度
            </Button>
          }
        />
      );
    }
    return null;
  };

  return (
    <PageContainer>
      <Spin spinning={loading}>
        <Card>
          {renderStatus()}
          <Form
            form={form}
            layout="horizontal"
            labelCol={{ span: 4 }}
            wrapperCol={{ span: 16 }}
            disabled={pending}
          >
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="shopName"
                  label="店铺名称"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="expireTime" label="有效期">
                  <DatePicker showTime style={{ width: '100%' }} disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="contactName" label="联系人">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="contactPhone" label="联系电话">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="logo" label="店铺Logo">
                  <Input placeholder="请输入Logo URL" />
                </Form.Item>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <Form.Item
                  name="announcement"
                  label="店铺公告"
                  labelCol={{ span: 2 }}
                  wrapperCol={{ span: 20 }}
                >
                  <TextArea rows={3} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="description"
                  label="店铺描述"
                  labelCol={{ span: 2 }}
                  wrapperCol={{ span: 20 }}
                >
                  <TextArea rows={3} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item wrapperCol={{ offset: 2 }}>
              <Button type="primary" onClick={handleSubmit} loading={saving}>
                {pending ? '审核中' : '提交审核'}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Spin>
      <Modal
        title="资料变更审批进度"
        open={diagramOpen}
        width={820}
        footer={null}
        onCancel={() => setDiagramOpen(false)}
        destroyOnHidden
      >
        {latest && (
          <FlowDiagram
            key={latest.id}
            load={() => getMyShopChangeDiagram(latest.id)}
          />
        )}
      </Modal>
    </PageContainer>
  );
};

export default ShopInfoPage;
