import { DownloadOutlined } from '@ant-design/icons';
import { ActionType, ProColumns, ProTable } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Button, Form, Input, message, Modal, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import { deliverOrder, exportOrders, getOrderList } from '@/services/ant-design-pro/api';

const ShopOrderShipPage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const shopId = initialState?.currentUser?.user?.shopId as number;
  const actionRef = useRef<ActionType>();

  const [shipOpen, setShipOpen] = useState(false);
  const [shippingOrderId, setShippingOrderId] = useState<number>(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchShipOpen, setBatchShipOpen] = useState(false);
  const [shipForm] = Form.useForm();
  const [batchForm] = Form.useForm();

  const handleShip = async () => {
    const values = await shipForm.validateFields();
    await deliverOrder({ orderId: shippingOrderId, ...values });
    message.success('发货成功');
    setShipOpen(false);
    shipForm.resetFields();
    actionRef.current?.reload();
  };

  const handleBatchShip = async () => {
    const values = await batchForm.validateFields();
    for (const id of selectedRowKeys) {
      await deliverOrder({ orderId: id as number, ...values });
    }
    message.success(`已批量发货 ${selectedRowKeys.length} 个订单`);
    setBatchShipOpen(false);
    batchForm.resetFields();
    setSelectedRowKeys([]);
    actionRef.current?.reload();
  };

  const handleExport = async () => {
    try {
      const blob = await exportOrders({ shopId, status: 1 });
      const url = window.URL.createObjectURL(blob as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `配货单_${new Date().toLocaleDateString()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      message.error('导出失败');
    }
  };

  const columns: ProColumns<API.OrderInfo>[] = [
    { title: '订单编号', dataIndex: 'orderNo', copyable: true },
    {
      title: '实付金额',
      dataIndex: 'payAmount',
      search: false,
      width: 100,
      render: (v) => (v !== undefined && v !== null ? `¥${(v as number).toFixed(2)}` : '-'),
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      search: false,
      width: 90,
      render: () => <Tag color="processing">待发货</Tag>,
    },
    { title: '收货人', dataIndex: 'receiverName', search: false, width: 80 },
    { title: '联系电话', dataIndex: 'receiverPhone', search: false, width: 120 },
    { title: '收货地址', dataIndex: 'receiverAddress', search: false, ellipsis: true },
    { title: '下单时间', dataIndex: 'createTime', search: false, valueType: 'dateTime' },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <a
          key="ship"
          onClick={() => {
            setShippingOrderId(record.id!);
            shipForm.resetFields();
            setShipOpen(true);
          }}
        >
          发货
        </a>,
      ],
    },
  ];

  return (
    <>
      <ProTable<API.OrderInfo>
        headerTitle="待发货订单"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        toolBarRender={() => [
          selectedRowKeys.length > 0 && (
            <Button
              key="batch"
              type="primary"
              onClick={() => {
                batchForm.resetFields();
                setBatchShipOpen(true);
              }}
            >
              批量发货({selectedRowKeys.length})
            </Button>
          ),
          <Button key="export" icon={<DownloadOutlined />} onClick={handleExport}>
            导出配货单
          </Button>,
        ]}
        request={async (params) => {
          const res = await getOrderList({
            current: params.current,
            size: params.pageSize,
            shopId,
            status: 1,
            orderNo: params.orderNo,
          });
          return {
            data: res.data?.records || [],
            total: res.data?.total || 0,
            success: res.code === 200,
          };
        }}
      />

      <Modal
        title="订单发货"
        open={shipOpen}
        onOk={handleShip}
        onCancel={() => {
          setShipOpen(false);
          shipForm.resetFields();
        }}
        destroyOnClose
      >
        <Form form={shipForm} layout="vertical">
          <Form.Item name="expressCompany" label="快递公司" rules={[{ required: true }]}>
            <Input placeholder="请输入快递公司" />
          </Form.Item>
          <Form.Item name="expressNo" label="快递单号" rules={[{ required: true }]}>
            <Input placeholder="请输入快递单号" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="批量发货"
        open={batchShipOpen}
        onOk={handleBatchShip}
        onCancel={() => {
          setBatchShipOpen(false);
          batchForm.resetFields();
        }}
        destroyOnClose
      >
        <p>
          将为选中的 <strong>{selectedRowKeys.length}</strong> 个订单统一填写物流信息
        </p>
        <Form form={batchForm} layout="vertical">
          <Form.Item name="expressCompany" label="快递公司" rules={[{ required: true }]}>
            <Input placeholder="请输入快递公司" />
          </Form.Item>
          <Form.Item name="expressNo" label="快递单号" rules={[{ required: true }]}>
            <Input placeholder="请输入快递单号" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ShopOrderShipPage;
