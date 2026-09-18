import { PageContainer } from '@ant-design/pro-components';
import { Button, Card, Form, InputNumber, message } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  getSettlementConfig,
  updateSettlementConfig,
} from '@/services/ant-design-pro/api';

const PlatformSettlementConfigPage: React.FC = () => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettlementConfig().then((res) => {
      if (res.code === 200 && res.data) {
        form.setFieldsValue({
          commissionRate: res.data.commissionRate,
          aftersaleDays: res.data.aftersaleDays,
        });
      }
    });
  }, [form]);

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const res = await updateSettlementConfig({
        commissionRate: values.commissionRate,
        aftersaleDays: values.aftersaleDays,
      });
      if (res.code === 200) {
        message.success('配置已保存');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer>
      <Card title="交易配置" style={{ maxWidth: 480 }}>
        <Form form={form} layout="vertical">
          <Form.Item
            name="commissionRate"
            label="全局佣金比例（%）"
            rules={[{ required: true, message: '请输入佣金比例' }]}
            extra="对每笔结算订单按「结算基数 × 比例」抽佣；修改只影响之后新生成的结算明细，已生成的按生成时快照计"
          >
            <InputNumber
              min={0}
              max={100}
              precision={2}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            name="aftersaleDays"
            label="售后窗口（天）"
            rules={[{ required: true, message: '请输入售后窗口天数' }]}
            extra="确认收货后 N 天内可申请售后（七天无理由底线）；修改即时生效，已提交的售后单不受影响。与结算周期 T+7 咬合：窗口 ≤ 7 天时退款必先于结算"
          >
            <InputNumber
              min={1}
              max={90}
              precision={0}
              style={{ width: '100%' }}
              addonAfter="天"
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleSave} loading={saving}>
              保存
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </PageContainer>
  );
};

export default PlatformSettlementConfigPage;
