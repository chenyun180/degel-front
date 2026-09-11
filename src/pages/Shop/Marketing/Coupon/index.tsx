import { ActionType, ModalForm, ProColumns, ProFormDateTimePicker, ProFormDependency, ProFormDigit, ProFormSelect, ProFormText, ProTable } from '@ant-design/pro-components';
import { message, Popconfirm, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import { createShopCoupon, getShopCoupons, stopShopCoupon } from '@/services/ant-design-pro/api';

// DateTimePicker 返回 'YYYY-MM-DD HH:mm:ss'（或无秒格式），统一转后端 LocalDateTime 可解析的 'YYYY-MM-DDTHH:mm:ss'
// 之前无条件 + ':00'，秒已存在时会拼出 '...:00:00' 导致 Jackson 反序列化 400
const toLocalDateTime = (v?: string) => {
  if (!v) return v;
  const s = v.replace(' ', 'T');
  return s.length === 16 ? `${s}:00` : s.slice(0, 19);
};
const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '未生效', color: 'default' },
  1: { text: '进行中', color: 'success' },
  2: { text: '停发', color: 'warning' },
};
const auditStatusMap: Record<number, { text: string; color: string }> = {
  1: { text: '待平台审核', color: 'processing' },
  2: { text: '已通过', color: 'success' },
  3: { text: '已驳回', color: 'error' },
};

const ShopCouponPage: React.FC = () => {
  const actionRef = useRef<ActionType>(undefined);
  const [createOpen, setCreateOpen] = useState(false);

  const columns: ProColumns<API.CouponItem>[] = [
    { title: '券名', dataIndex: 'name', ellipsis: true },
    {
      title: '优惠',
      width: 110,
      search: false,
      render: (_, r) =>
        r.discountType === 1
          ? `满${Number(r.thresholdAmount)}减${Number(r.discountValue).toFixed(2)}`
          : r.discountType === 2
            ? `${Number(r.discountValue)}折`
            : `立减¥${Number(r.discountValue).toFixed(2)}`,
    },
    {
      title: '领取',
      width: 90,
      search: false,
      render: (_, r) => `${r.issuedCount}/${r.totalCount}（限${r.perUserLimit}）`,
    },
    {
      title: '审核状态',
      dataIndex: 'auditStatus',
      width: 100,
      search: false,
      render: (_, r) => {
        const t = auditStatusMap[r.auditStatus] || { text: '-', color: 'default' };
        return <Tag color={t.color}>{t.text}</Tag>;
      },
    },
    {
      title: '驳回理由',
      dataIndex: 'rejectReason',
      search: false,
      ellipsis: true,
      render: (v, r) => (r.auditStatus === 3 ? <span style={{ color: 'red' }}>{v}</span> : '-'),
    },
    {
      title: '发放状态',
      dataIndex: 'status',
      valueType: 'select',
      width: 90,
      valueEnum: new Map([
        [0, { text: '未生效' }],
        [1, { text: '进行中' }],
        [2, { text: '停发' }],
      ]),
      render: (_, r) => {
        const t = statusMap[r.status] || { text: '-', color: 'default' };
        return <Tag color={t.color}>{t.text}</Tag>;
      },
    },
    { title: '可领时间', dataIndex: 'receiveStart', search: false, valueType: 'dateTime', width: 150, render: (_, r) => `${(r.receiveStart || '').slice(0, 16)} ~ ${(r.receiveEnd || '').slice(5, 16)}` },
    {
      title: '操作',
      valueType: 'option',
      width: 80,
      render: (_, record) =>
        record.status === 1
          ? [
              <Popconfirm
                key="stop"
                title="停发后不可再领，已发出的券仍可用。确认停发?"
                onConfirm={async () => {
                  const res = await stopShopCoupon(record.id);
                  if (res.code === 200) {
                    message.success('已停发');
                    actionRef.current?.reload();
                  } else {
                    message.error(res.msg || '操作失败');
                  }
                }}
              >
                <a>停发</a>
              </Popconfirm>,
            ]
          : null,
    },
  ];

  return (
    <>
      <ProTable<API.CouponItem>
        headerTitle="我的优惠券（创建后需平台审核通过才可领取；总量≤5000、每人限领≤5）"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        toolBarRender={() => [
          <a key="create" onClick={() => setCreateOpen(true)}>
            + 新建优惠券
          </a>,
        ]}
        request={async (params) => {
          const res = await getShopCoupons({
            current: params.current,
            size: params.pageSize,
            name: params.name,
            status: params.status,
          });
          return {
            data: res.data?.records || [],
            total: res.data?.total || 0,
            success: res.code === 200,
          };
        }}
      />

      <ModalForm
        title="新建店铺券（提交平台审核）"
        width={500}
        open={createOpen}
        onOpenChange={setCreateOpen}
        modalProps={{ destroyOnClose: true }}
        submitter={{
          searchConfig: { submitText: '提交审核' },
          resetButtonProps: { style: { display: 'none' } },
        }}
        onFinish={async (values) => {
          const payload: API.CouponCreateParams = {
            ...values,
            receiveStart: toLocalDateTime(values.receiveStart),
            receiveEnd: toLocalDateTime(values.receiveEnd),
            validStart: toLocalDateTime(values.validStart),
            validEnd: toLocalDateTime(values.validEnd),
          };
          const res = await createShopCoupon(payload);
          if (res.code === 200) {
            message.success('已提交，等待平台审核');
            actionRef.current?.reload();
            return true;
          }
          message.error(res.msg || '创建失败');
          return false;
        }}
      >
        <ProFormText name="name" label="券名" rules={[{ required: true }]} placeholder="如 本店满30减5" />
        <ProFormSelect
          name="discountType"
          label="优惠类型"
          initialValue={1}
          options={[
            { value: 1, label: '满减（满X减Y）' },
            { value: 3, label: '无门槛（立减）' },
            { value: 2, label: '折扣（如 8.5 = 八五折，可配门槛）' },
          ]}
        />
        <ProFormDigit name="thresholdAmount" label="使用门槛（满X元，0=无门槛）" min={0} fieldProps={{ precision: 2 }} />
        <ProFormDigit name="discountValue" label="优惠值（满减/无门槛=金额；折扣=折数如8.5）" min={0.01} fieldProps={{ precision: 2 }} rules={[{ required: true }]} />
        <ProFormDigit name="totalCount" label="发放总量（≤5000）" min={1} max={5000} fieldProps={{ precision: 0 }} rules={[{ required: true }]} />
        <ProFormDigit name="perUserLimit" label="每人限领（≤5）" min={1} max={5} initialValue={1} fieldProps={{ precision: 0 }} rules={[{ required: true }]} />
        <ProFormDateTimePicker name="receiveStart" label="可领开始" rules={[{ required: true }]} />
        <ProFormDateTimePicker name="receiveEnd" label="可领截止" rules={[{ required: true }]} />
        <ProFormSelect
          name="validType"
          label="有效期方式"
          initialValue={2}
          options={[
            { value: 2, label: '领取后N天' },
            { value: 1, label: '绝对时间' },
          ]}
        />
        {/* 有效期字段按 validType 条件渲染：N天模式只收 validDays，绝对时间模式必须填起止时间（后端 validateCreate 强校验） */}
        <ProFormDependency name={['validType']}>
          {({ validType }) =>
            validType === 1 ? (
              <>
                <ProFormDateTimePicker name="validStart" label="生效开始" rules={[{ required: true }]} />
                <ProFormDateTimePicker name="validEnd" label="生效截止" rules={[{ required: true }]} />
              </>
            ) : (
              <ProFormDigit name="validDays" label="领取后N天有效" min={1} initialValue={7} fieldProps={{ precision: 0 }} rules={[{ required: true }]} />
            )
          }
        </ProFormDependency>
      </ModalForm>
    </>
  );
};

export default ShopCouponPage;
