import { useModel } from '@umijs/max';
import { Button, DatePicker, Form, Input, message, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { getShopById, updateShop } from '@/services/ant-design-pro/api';

const ShopInfoPage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const shopId = initialState?.currentUser?.user?.shopId;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!shopId) return;
    setLoading(true);
    getShopById(shopId).then((res) => {
      if (res.code === 200 && res.data) {
        form.setFieldsValue({
          shopName: res.data.shopName,
          contactName: res.data.contactName,
          contactPhone: res.data.contactPhone,
          expireTime: res.data.expireTime ? dayjs(res.data.expireTime) : undefined,
        });
      }
    }).finally(() => setLoading(false));
  }, [shopId]);

  const handleSave = async () => {
    const values = await form.validateFields();
    if (values.expireTime) {
      values.expireTime = values.expireTime.format('YYYY-MM-DD HH:mm:ss');
    }
    setSaving(true);
    try {
      await updateShop({ ...values, id: shopId });
      message.success('保存成功');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Spin spinning={loading}>
      <div style={{ maxWidth: 600, padding: 24, background: '#fff', borderRadius: 8 }}>
        <h2 style={{ marginBottom: 24 }}>店铺信息</h2>
        <Form form={form} layout="vertical">
          <Form.Item name="shopName" label="店铺名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="contactName" label="联系人">
            <Input />
          </Form.Item>
          <Form.Item name="contactPhone" label="联系电话">
            <Input />
          </Form.Item>
          <Form.Item name="expireTime" label="有效期">
            <DatePicker showTime style={{ width: '100%' }} disabled />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleSave} loading={saving}>保存</Button>
          </Form.Item>
        </Form>
      </div>
    </Spin>
  );
};

export default ShopInfoPage;
