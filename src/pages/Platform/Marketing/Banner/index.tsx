import {
  type ActionType,
  ModalForm,
  type ProColumns,
  ProFormDateTimePicker,
  ProFormDependency,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { Form, Image, message, Popconfirm, Switch } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import React, { useRef, useState } from 'react';
import ImageUpload from '@/components/FileUpload/ImageUpload';
import {
  deleteBanner,
  getBannerPage,
  saveBanner,
  toggleBannerStatus,
} from '@/services/ant-design-pro/api';
import { fileUrl } from '@/utils/fileUrl';

const linkTypeMap: Record<number, string> = {
  0: '无跳转',
  1: '内部页面',
  2: '商品详情',
  3: '外部链接',
};

type BannerFormValues = {
  title?: string;
  image?: string;
  linkType?: number;
  linkValue?: string | number;
  sort?: number;
  startTime?: Dayjs | string | null;
  endTime?: Dayjs | string | null;
};

// 表单时间值（Dayjs 或字符串）→ 后端 BannerCreateVo @JsonFormat 的 'yyyy-MM-dd HH:mm:ss'
// 注意：与 Coupon 不同（那边转 ISO 'T' 格式），Banner 后端就是空格格式，原样传
const formatTime = (v?: Dayjs | string | null): string | null => {
  if (!v) return null;
  if (typeof v === 'string') {
    return v.slice(0, 19).replace('T', ' ') || null;
  }
  return v.format('YYYY-MM-DD HH:mm:ss');
};

const asDayjs = (v?: Dayjs | string | null): Dayjs | undefined =>
  typeof v === 'string' ? dayjs(v) : (v ?? undefined);

const PlatformBannerPage: React.FC = () => {
  const actionRef = useRef<ActionType>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<API.BannerItem | null>(null);

  const doToggle = async (id: string) => {
    const res = await toggleBannerStatus(id);
    if (res.code === 200) {
      message.success('状态已更新');
      actionRef.current?.reload();
    } else {
      message.error(res.msg || '操作失败');
    }
  };

  const doDelete = async (id: string) => {
    const res = await deleteBanner(id);
    if (res.code === 200) {
      message.success('已删除');
      actionRef.current?.reload();
    } else {
      message.error(res.msg || '删除失败');
    }
  };

  const columns: ProColumns<API.BannerItem>[] = [
    {
      title: '图片',
      dataIndex: 'image',
      search: false,
      width: 110,
      render: (_, r) =>
        r.image ? (
          <Image
            src={fileUrl(r.image)}
            alt={r.title}
            width={80}
            height={48}
            style={{ objectFit: 'cover', borderRadius: 4 }}
          />
        ) : (
          '-'
        ),
    },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    {
      title: '跳转',
      dataIndex: 'linkType',
      search: false,
      width: 140,
      ellipsis: true,
      render: (_, r) => {
        const text = linkTypeMap[r.linkType] || '未知';
        return r.linkType > 0 && r.linkValue ? `${text}：${r.linkValue}` : text;
      },
    },
    {
      title: '排序',
      dataIndex: 'sort',
      search: false,
      width: 70,
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      width: 90,
      valueEnum: new Map([
        [1, { text: '上架' }],
        [0, { text: '下架' }],
      ]),
      render: (_, r) => (
        <Switch
          checked={r.status === 1}
          checkedChildren="上架"
          unCheckedChildren="下架"
          onChange={() => doToggle(r.id)}
        />
      ),
    },
    {
      title: '生效期',
      search: false,
      width: 320,
      ellipsis: true,
      render: (_, r) => `${r.startTime || '立即'} ~ ${r.endTime || '永久'}`,
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
      render: (_, record) => [
        <a
          key="edit"
          onClick={() => {
            setEditing(record);
            setModalOpen(true);
          }}
        >
          编辑
        </a>,
        <Popconfirm
          key="delete"
          title="确认删除该轮播图?"
          onConfirm={() => doDelete(record.id)}
        >
          <a>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProTable<API.BannerItem>
        headerTitle="轮播图管理（C 端首页banner）"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        toolBarRender={() => [
          <a
            key="create"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            + 新建轮播图
          </a>,
        ]}
        request={async (params) => {
          // 后端分页参数是 page/pageSize（不是 current/size）
          const res = await getBannerPage({
            page: params.current,
            pageSize: params.pageSize,
            title: params.title,
            status: params.status,
          });
          return {
            data: res.data?.records || [],
            total: res.data?.total || 0,
            success: res.code === 200,
          };
        }}
      />

      <ModalForm<BannerFormValues>
        key={editing?.id ?? 'new'}
        title={`${editing ? '编辑' : '新建'}轮播图`}
        width={520}
        open={modalOpen}
        onOpenChange={setModalOpen}
        modalProps={{ destroyOnClose: true }}
        submitter={{
          searchConfig: { submitText: editing ? '保存' : '创建' },
          resetButtonProps: { style: { display: 'none' } },
        }}
        initialValues={
          editing
            ? {
                title: editing.title,
                image: editing.image,
                linkType: editing.linkType,
                linkValue: editing.linkValue ?? undefined,
                sort: editing.sort,
                // 编辑回显：'yyyy-MM-dd HH:mm:ss' 字符串 → Dayjs
                startTime: editing.startTime
                  ? dayjs(editing.startTime)
                  : undefined,
                endTime: editing.endTime ? dayjs(editing.endTime) : undefined,
              }
            : { linkType: 0, sort: 0 }
        }
        onFinish={async (values) => {
          const linkType = values.linkType ?? 0;
          const payload: API.BannerSaveParams = {
            id: editing?.id,
            title: (values.title || '').trim(),
            image: values.image || '',
            linkType,
            // linkType=0 时 linkValue 置 null；=2 时 InputNumber 出 number，统一转字符串
            linkValue:
              linkType === 0 ? null : String(values.linkValue ?? '').trim(),
            sort: values.sort ?? 0,
            startTime: formatTime(values.startTime),
            endTime: formatTime(values.endTime),
          };
          const res = await saveBanner(payload);
          if (res.code === 200) {
            message.success(editing ? '保存成功' : '创建成功');
            actionRef.current?.reload();
            return true;
          }
          message.error(res.msg || (editing ? '保存失败' : '创建失败'));
          return false;
        }}
      >
        <ProFormText
          name="title"
          label="标题"
          rules={[
            { required: true, message: '请输入标题' },
            { max: 64, message: '标题不能超过64个字符' },
          ]}
          placeholder="如 新人专享大促"
        />
        <Form.Item
          name="image"
          label="图片"
          rules={[{ required: true, message: '请上传图片' }]}
        >
          <ImageUpload buttonText="上传轮播图" />
        </Form.Item>
        <ProFormSelect
          name="linkType"
          label="跳转类型"
          initialValue={0}
          options={[
            { value: 0, label: '无跳转' },
            { value: 1, label: '内部页面' },
            { value: 2, label: '商品详情' },
            { value: 3, label: '外部链接' },
          ]}
        />
        <ProFormDependency name={['linkType']}>
          {({ linkType }) =>
            linkType === 1 ? (
              <ProFormText
                name="linkValue"
                label="页面路径"
                placeholder="/pages/coupon/center/index"
                rules={[
                  { required: true, message: '请输入页面路径' },
                  {
                    pattern: /^\/\S+$/,
                    message:
                      '页面路径须以 / 开头，如 /pages/coupon/center/index',
                  },
                ]}
              />
            ) : linkType === 2 ? (
              <ProFormDigit
                name="linkValue"
                label="商品 spuId"
                min={1}
                fieldProps={{ precision: 0 }}
                rules={[{ required: true, message: '请输入商品 spuId' }]}
              />
            ) : linkType === 3 ? (
              <ProFormText
                name="linkValue"
                label="外部链接"
                placeholder="https://example.com/activity"
                rules={[
                  { required: true, message: '请输入外部链接' },
                  {
                    pattern: /^https:\/\//,
                    message: '外部链接必须以 https:// 开头',
                  },
                ]}
              />
            ) : null
          }
        </ProFormDependency>
        <ProFormDigit
          name="sort"
          label="排序（数字小靠前）"
          min={0}
          initialValue={0}
          fieldProps={{ precision: 0 }}
        />
        <ProFormDateTimePicker
          name="startTime"
          label="生效时间（清空=立即生效）"
          fieldProps={{ allowClear: true }}
        />
        <ProFormDateTimePicker
          name="endTime"
          label="失效时间（清空=永久有效）"
          fieldProps={{ allowClear: true }}
          rules={[
            ({ getFieldValue }) => ({
              validator(_, value) {
                const start = asDayjs(
                  value ? getFieldValue('startTime') : null,
                );
                const end = asDayjs(value);
                if (start && end && !end.isAfter(start)) {
                  return Promise.reject(new Error('失效时间必须晚于生效时间'));
                }
                return Promise.resolve();
              },
            }),
          ]}
        />
      </ModalForm>
    </>
  );
};

export default PlatformBannerPage;
