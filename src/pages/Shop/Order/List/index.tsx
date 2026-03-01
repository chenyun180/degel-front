import { ActionType, ProColumns, ProTable } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import {
  Descriptions,
  Drawer,
  Form,
  Image,
  Input,
  message,
  Modal,
  Space,
  Table,
  Tag,
} from 'antd';
import React, { useRef, useState } from 'react';
import { deliverOrder, getOrderDetail, getOrderList } from '@/services/ant-design-pro/api';

const orderStatusMap: Record<number, { text: string; color: string }> = {
  0: { text: '待付款', color: 'default' },
  1: { text: '待发货', color: 'processing' },
  2: { text: '已发货', color: 'blue' },
  3: { text: '已完成', color: 'success' },
  4: { text: '已取消', color: 'default' },
  5: { text: '售后中', color: 'warning' },
};

const statusTabs = [
  { label: '全部', value: '' },
  { label: '待付款', value: '0' },
  { label: '待发货', value: '1' },
  { label: '已发货', value: '2' },
  { label: '已完成', value: '3' },
  { label: '已取消', value: '4' },
  { label: '售后中', value: '5' },
];

const ShopOrderListPage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const shopId = initialState?.currentUser?.user?.shopId as number;
  const actionRef = useRef<ActionType>();

  const [activeTab, setActiveTab] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<API.OrderDetailVo | null>(null);
  const [shipOpen, setShipOpen] = useState(false);
  const [shippingOrderId, setShippingOrderId] = useState<number>(0);
  const [shipForm] = Form.useForm();

  const handleViewDetail = async (id: number) => {
    const res = await getOrderDetail(id);
    if (res.code === 200) {
      setDetail(res.data);
      setDetailOpen(true);
    }
  };

  const handleShip = async () => {
    const values = await shipForm.validateFields();
    await deliverOrder({ orderId: shippingOrderId, ...values });
    message.success('发货成功');
    setShipOpen(false);
    shipForm.resetFields();
    actionRef.current?.reload();
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
      render: (v) => {
        const s = orderStatusMap[v as number] || { text: '未知', color: 'default' };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    { title: '收货人', dataIndex: 'receiverName', search: false, width: 80 },
    { title: '下单时间', dataIndex: 'createTime', search: false, valueType: 'dateTime' },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) =>
        [
          <a key="detail" onClick={() => handleViewDetail(record.id!)}>
            详情
          </a>,
          record.status === 1 ? (
            <a
              key="ship"
              onClick={() => {
                setShippingOrderId(record.id!);
                shipForm.resetFields();
                setShipOpen(true);
              }}
            >
              发货
            </a>
          ) : null,
        ].filter(Boolean),
    },
  ];

  return (
    <>
      <ProTable<API.OrderInfo>
        headerTitle="订单管理"
        actionRef={actionRef}
        rowKey="id"
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
          const res = await getOrderList({
            current: params.current,
            size: params.pageSize,
            shopId,
            orderNo: params.orderNo,
            status: activeTab || undefined,
          });
          return {
            data: res.data?.records || [],
            total: res.data?.total || 0,
            success: res.code === 200,
          };
        }}
      />

      <Drawer
        title="订单详情"
        width={640}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      >
        {detail && (
          <>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="订单编号">{detail.order.orderNo}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag
                  color={
                    (orderStatusMap[detail.order.status!] || { color: 'default' }).color
                  }
                >
                  {(orderStatusMap[detail.order.status!] || { text: '未知' }).text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="实付金额">
                ¥{detail.order.payAmount?.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="运费">
                ¥{detail.order.freightAmount?.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="收货人">{detail.order.receiverName}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{detail.order.receiverPhone}</Descriptions.Item>
              <Descriptions.Item label="收货地址" span={2}>
                {detail.order.receiverAddress}
              </Descriptions.Item>
              <Descriptions.Item label="买家备注" span={2}>
                {detail.order.remark || '-'}
              </Descriptions.Item>
              {detail.order.expressCompany && (
                <>
                  <Descriptions.Item label="快递公司">
                    {detail.order.expressCompany}
                  </Descriptions.Item>
                  <Descriptions.Item label="快递单号">
                    {detail.order.expressNo}
                  </Descriptions.Item>
                </>
              )}
              <Descriptions.Item label="下单时间">{detail.order.createTime}</Descriptions.Item>
              <Descriptions.Item label="支付时间">
                {detail.order.payTime || '-'}
              </Descriptions.Item>
            </Descriptions>

            <h4 style={{ marginTop: 16, marginBottom: 8 }}>商品明细</h4>
            <Table<API.OrderItem>
              dataSource={detail.items}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                {
                  title: '商品',
                  dataIndex: 'spuName',
                  render: (v, record) => (
                    <Space>
                      {record.skuImage && <Image src={record.skuImage} width={40} height={40} />}
                      <span>{v as string}</span>
                    </Space>
                  ),
                },
                { title: '规格', dataIndex: 'skuSpec' },
                {
                  title: '单价',
                  dataIndex: 'price',
                  render: (v) => `¥${(v as number)?.toFixed(2)}`,
                },
                { title: '数量', dataIndex: 'quantity' },
                {
                  title: '小计',
                  dataIndex: 'totalAmount',
                  render: (v) => `¥${(v as number)?.toFixed(2)}`,
                },
              ]}
            />
          </>
        )}
      </Drawer>

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
    </>
  );
};

export default ShopOrderListPage;
