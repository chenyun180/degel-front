import { PageContainer } from '@ant-design/pro-components';
import { Button, Card, Col, DatePicker, Form, Input, message, Row, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { getMyShop, updateMyShop } from '@/services/ant-design-pro/api';

const { TextArea } = Input;

const ShopInfoPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    getMyShop()
      .then((res) => {
        if (res.code === 200 && res.data) {
          form.setFieldsValue({
            shopName: res.data.shopName,
            contactName: res.data.contactName,
            contactPhone: res.data.contactPhone,
            logo: res.data.logo,
            announcement: res.data.announcement,
            description: res.data.description,
            expireTime: res.data.expireTime ? dayjs(res.data.expireTime) : undefined,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const values = await form.validateFields();
    const { expireTime, ...submitData } = values;
    setSaving(true);
    try {
      await updateMyShop(submitData);
      message.success('保存成功');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer>
      <Spin spinning={loading}>
        <Card>
          <Form form={form} layout="horizontal" labelCol={{ span: 4 }} wrapperCol={{ span: 16 }}>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item name="shopName" label="店铺名称" rules={[{ required: true }]}>
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
                <Form.Item name="announcement" label="店铺公告" labelCol={{ span: 2 }} wrapperCol={{ span: 20 }}>
                  <TextArea rows={3} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="description" label="店铺描述" labelCol={{ span: 2 }} wrapperCol={{ span: 20 }}>
                  <TextArea rows={3} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item wrapperCol={{ offset: 2 }}>
              <Button type="primary" onClick={handleSave} loading={saving}>
                保存
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Spin>
    </PageContainer>
  );
};

export default ShopInfoPage;
