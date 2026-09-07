import {
  ActionType,
  ModalForm,
  ProColumns,
  ProFormDateTimePicker,
  ProFormDependency,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { Input, Modal, message, Popconfirm, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import {
  auditShopCoupon,
  createPlatformCoupon,
  getPlatformCoupons,
  getShopList,
  stopPlatformCoupon,
} from '@/services/ant-design-pro/api';

const funderTypeMap: Record<number, { text: string; color: string }> = {
  1: { text: '平台券', color: 'blue' },
  2: { text: '店铺券', color: 'green' },
  3: { text: '分摊券', color: 'purple' },
};

const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '未生效', color: 'default' },
  1: { text: '进行中', color: 'success' },
  2: { text: '停发', color: 'warning' },
};
const auditStatusMap: Record<number, { text: string; color: string }> = {
  1: { text: '待审核', color: 'processing' },
  2: { text: '已通过', color: 'success' },
  3: { text: '已驳回', color: 'error' },
};

const couponFaceText = (r: API.CouponItem) => {
  if (r.discountType === 2) return `${Number(r.discountValue)}折`;
  return `¥${Number(r.discountValue).toFixed(2)}`;
};

// DateTimePicker 返回 'YYYY-MM-DD HH:mm:ss'（或无秒格式），统一转后端 LocalDateTime 可解析的 'YYYY-MM-DDTHH:mm:ss'
// 之前无条件 + ':00'，秒已存在时会拼出 '...:00:00' 导致 Jackson 反序列化 400
const toLocalDateTime = (v?: string) => {
  if (!v) return v;
  const s = v.replace(' ', 'T');
  return s.length === 16 ? `${s}:00` : s.slice(0, 19);
};

const PlatformCouponPage: React.FC = () => {
  const actionRef = useRef<ActionType>(undefined);
  const [createOpen, setCreateOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<API.CouponItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const doAudit = async (
    couponId: string,
    passed: boolean,
    reason?: string,
  ) => {
    const res = await auditShopCoupon({
      couponId,
      passed,
      rejectReason: reason,
    });
    if (res.code === 200) {
      message.success(passed ? '已通过' : '已驳回');
      actionRef.current?.reload();
    } else {
      message.error(res.msg || '操作失败');
    }
  };

  const columns: ProColumns<API.CouponItem>[] = [
    { title: '券名', dataIndex: 'name', ellipsis: true },
    {
      title: '券型',
      dataIndex: 'funderType',
      width: 90,
      search: false,
      render: (_, r) => {
        const t = funderTypeMap[r.funderType] || {
          text: '未知',
          color: 'default',
        };
        return <Tag color={t.color}>{t.text}</Tag>;
      },
    },
    {
      title: '优惠面额',
      width: 90,
      search: false,
      render: (_, r) =>
        r.discountType === 1
          ? `满${Number(r.thresholdAmount)}减${couponFaceText(r)}`
          : couponFaceText(r),
    },
    {
      title: '出资拆分',
      width: 130,
      search: false,
      render: (_, r) =>
        r.funderType === 3
          ? `平台¥${Number(r.platformAmount).toFixed(2)} / 店铺¥${Number(r.shopAmount).toFixed(2)}`
          : r.funderType === 1
            ? '平台全出'
            : '店铺全出',
    },
    {
      title: '店铺ID',
      dataIndex: 'shopId',
      width: 80,
      search: false,
      render: (v) => v || '-',
    },
    {
      title: '领取',
      width: 90,
      search: false,
      render: (_, r) =>
        `${r.issuedCount}/${r.totalCount}（限${r.perUserLimit}）`,
    },
    {
      title: '审核状态',
      dataIndex: 'auditStatus',
      valueType: 'select',
      width: 90,
      valueEnum: new Map([
        [1, { text: '待审核' }],
        [2, { text: '已通过' }],
        [3, { text: '已驳回' }],
      ]),
      render: (_, r) => {
        const t = auditStatusMap[r.auditStatus] || {
          text: '-',
          color: 'default',
        };
        return <Tag color={t.color}>{t.text}</Tag>;
      },
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
    {
      title: '驳回理由',
      dataIndex: 'rejectReason',
      search: false,
      ellipsis: true,
      render: (v, r) =>
        r.auditStatus === 3 ? <span style={{ color: 'red' }}>{v}</span> : '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      search: false,
      valueType: 'dateTime',
      width: 150,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      render: (_, record) =>
        [
          record.auditStatus === 1 ? (
            <Popconfirm
              key="pass"
              title="确认通过该券?"
              onConfirm={() => doAudit(record.id, true)}
            >
              <a>通过</a>
            </Popconfirm>
          ) : null,
          record.auditStatus === 1 ? (
            <a
              key="reject"
              onClick={() => {
                setRejectTarget(record);
                setRejectReason('');
              }}
            >
              驳回
            </a>
          ) : null,
          record.status === 1 && record.auditStatus === 2 ? (
            <Popconfirm
              key="stop"
              title="停发后不可再领，已发出的券仍可用。确认停发?"
              onConfirm={async () => {
                const res = await stopPlatformCoupon(record.id);
                if (res.code === 200) {
                  message.success('已停发');
                  actionRef.current?.reload();
                } else {
                  message.error(res.msg || '操作失败');
                }
              }}
            >
              <a>停发</a>
            </Popconfirm>
          ) : null,
        ].filter(Boolean),
    },
  ];

  return (
    <>
      <ProTable<API.CouponItem>
        headerTitle="优惠券管理（平台券 / 分摊券创建 + 店铺券审核）"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        toolBarRender={() => [
          <a key="create" onClick={() => setCreateOpen(true)}>
            + 新建券
          </a>,
        ]}
        request={async (params) => {
          const res = await getPlatformCoupons({
            current: params.current,
            size: params.pageSize,
            name: params.name,
            status: params.status,
            auditStatus: params.auditStatus,
          });
          return {
            data: res.data?.records || [],
            total: res.data?.total || 0,
            success: res.code === 200,
          };
        }}
      />

      <ModalForm
        title="新建券（平台券 / 分摊券）"
        width={520}
        open={createOpen}
        onOpenChange={setCreateOpen}
        modalProps={{ destroyOnClose: true }}
        submitter={{
          searchConfig: { submitText: '创建' },
          resetButtonProps: { style: { display: 'none' } },
        }}
        onFinish={async (values) => {
          const payload: API.CouponCreateParams = {
            ...values,
            funderType: values.funderType ?? 1,
            receiveStart: toLocalDateTime(values.receiveStart),
            receiveEnd: toLocalDateTime(values.receiveEnd),
          };
          if (!payload.funderType || payload.funderType !== 3) {
            delete payload.shopId;
            delete payload.platformAmount;
            delete payload.shopAmount;
          }
          const res = await createPlatformCoupon(payload);
          if (res.code === 200) {
            message.success('创建成功（创建即生效）');
            actionRef.current?.reload();
            return true;
          }
          message.error(res.msg || '创建失败');
          return false;
        }}
      >
        <ProFormText
          name="name"
          label="券名"
          rules={[{ required: true }]}
          placeholder="如 新客立减10元"
        />
        <ProFormSelect
          name="funderType"
          label="券型"
          initialValue={1}
          options={[
            { value: 1, label: '平台券（平台全出）' },
            { value: 3, label: '分摊券（平台+店铺按比例出资）' },
          ]}
        />
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
        <ProFormDigit
          name="thresholdAmount"
          label="使用门槛（满X元，0=无门槛）"
          min={0}
          fieldProps={{ precision: 2 }}
        />
        <ProFormDigit
          name="discountValue"
          label="优惠值（满减/无门槛=金额；折扣=折数如8.5）"
          min={0.01}
          fieldProps={{ precision: 2 }}
          rules={[{ required: true }]}
        />
        {/* 仅分摊券展示：合作店铺 + 出资拆分 */}
        <ProFormDependency name={['funderType']}>
          {({ funderType }) =>
            funderType === 3 ? (
              <>
                <ProFormSelect
                  name="shopId"
                  label="合作店铺"
                  placeholder="搜索或选择合作店铺"
                  showSearch
                  request={async () => {
                    const res = await getShopList({ current: 1, size: 500 });
                    const records = res.data?.records || [];
                    return records
                      .filter((s) => s.status === 0) // 0=正常，1=停用
                      .map((s) => ({
                        value: s.id,
                        label: `${s.shopName}（ID:${s.id}）`,
                      }));
                  }}
                  fieldProps={{ optionFilterProp: 'label' }}
                  rules={[
                    { required: true, message: '分摊券必须选择合作店铺' },
                  ]}
                />
                <ProFormDigit
                  name="platformAmount"
                  label="平台承担"
                  min={0.01}
                  fieldProps={{ precision: 2 }}
                  rules={[{ required: true, message: '请填写平台承担金额' }]}
                />
                <ProFormDigit
                  name="shopAmount"
                  label="店铺承担（满减时两者之和须等于优惠额）"
                  min={0.01}
                  fieldProps={{ precision: 2 }}
                  rules={[{ required: true, message: '请填写店铺承担金额' }]}
                />
              </>
            ) : null
          }
        </ProFormDependency>
        <ProFormDigit
          name="totalCount"
          label="发放总量"
          min={1}
          fieldProps={{ precision: 0 }}
          rules={[{ required: true }]}
        />
        <ProFormDigit
          name="perUserLimit"
          label="每人限领"
          min={1}
          initialValue={1}
          fieldProps={{ precision: 0 }}
          rules={[{ required: true }]}
        />
        <ProFormDateTimePicker
          name="receiveStart"
          label="可领开始"
          rules={[{ required: true }]}
        />
        <ProFormDateTimePicker
          name="receiveEnd"
          label="可领截止"
          rules={[{ required: true }]}
        />
        <ProFormSelect
          name="validType"
          label="有效期方式"
          initialValue={2}
          options={[
            { value: 2, label: '领取后N天' },
            { value: 1, label: '绝对时间' },
          ]}
        />
        <ProFormDigit
          name="validDays"
          label="领取后N天有效"
          min={1}
          initialValue={7}
          fieldProps={{ precision: 0 }}
        />
      </ModalForm>

      <Modal
        title={`驳回券：${rejectTarget?.name ?? ''}`}
        open={!!rejectTarget}
        onOk={async () => {
          if (!rejectReason.trim()) {
            message.warning('请填写驳回理由');
            return;
          }
          await doAudit(rejectTarget!.id, false, rejectReason.trim());
          setRejectTarget(null);
        }}
        onCancel={() => setRejectTarget(null)}
      >
        <Input.TextArea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="驳回理由（必填）"
          maxLength={200}
          showCount
        />
      </Modal>
    </>
  );
};

export default PlatformCouponPage;
