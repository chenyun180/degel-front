import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useModel, useSearchParams } from '@umijs/max';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Space,
  Spin,
  TreeSelect,
} from 'antd';
import React, { useEffect, useState } from 'react';
import ImageGalleryUpload from '@/components/FileUpload/ImageGalleryUpload';
import ImageUpload from '@/components/FileUpload/ImageUpload';
import RichTextEditor from '@/components/RichTextEditor';
import {
  createSpu,
  getCategoryTree,
  getSpuDetail,
  updateSpu,
} from '@/services/ant-design-pro/api';
import {
  joinImageUrls,
  parseSkuAttributes,
  serializeSkuAttributes,
  splitImageUrls,
} from './helpers';

const buildTreeData = (list: API.ProductCategory[]): any[] =>
  list.map((item) => ({
    title: item.name,
    value: item.id,
    children: item.children ? buildTreeData(item.children) : [],
  }));

const defaultSkuAttribute = (): API.SkuAttributePair[] => [
  { key: '颜色', value: '' },
  { key: '尺码', value: '' },
];

const createEmptySku = () => ({
  attributes: defaultSkuAttribute(),
  price: undefined,
  originalPrice: undefined,
  costPrice: undefined,
  stock: undefined,
  stockWarning: 0,
  weight: undefined,
  image: '',
});

const ShopProductCreatePage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const shopId = initialState?.currentUser?.user?.shopId as number;
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categoryTree, setCategoryTree] = useState<any[]>([]);

  useEffect(() => {
    getCategoryTree()
      .then((res) => {
        if (res.code === 200) {
          setCategoryTree(buildTreeData(res.data || []));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!editId) {
      form.setFieldsValue({ skuList: [createEmptySku()], images: [] });
      return;
    }

    setLoading(true);
    getSpuDetail(Number(editId))
      .then((res) => {
        if (res.code === 200 && res.data) {
          const { spu, skuList } = res.data;
          form.setFieldsValue({
            name: spu.name,
            subtitle: spu.subtitle,
            categoryId: spu.categoryId,
            keyword: spu.keyword,
            mainImage: spu.mainImage,
            images: splitImageUrls(spu.images),
            description: spu.description,
            detailContent: spu.detailContent,
            skuList: skuList.map((sku) => ({
              id: sku.id,
              skuCode: sku.skuCode,
              attributes: parseSkuAttributes(sku.specData),
              price: sku.price,
              originalPrice: sku.originalPrice,
              costPrice: sku.costPrice,
              stock: sku.stock,
              stockWarning: sku.stockWarning,
              weight: sku.weight,
              image: sku.image,
            })),
          });
        }
      })
      .finally(() => setLoading(false));
  }, [editId, form]);

  const handleSave = async () => {
    const values = await form.validateFields();
    const normalizedSkuList = (values.skuList || []).map((sku: any) => {
      const specData = serializeSkuAttributes(sku.attributes || []);
      if (specData === '{}') {
        throw new Error('empty-spec');
      }

      return {
        id: sku.id,
        skuCode: sku.skuCode,
        specData,
        price: sku.price,
        originalPrice: sku.originalPrice,
        costPrice: sku.costPrice,
        stock: sku.stock,
        stockWarning: sku.stockWarning,
        weight: sku.weight,
        image: sku.image,
      };
    });

    setSaving(true);
    try {
      const payload = {
        ...values,
        shopId,
        auditStatus: 0,
        images: joinImageUrls(values.images),
        skuList: normalizedSkuList,
      };

      if (editId) {
        await updateSpu({ ...payload, id: Number(editId) });
        message.success('修改成功');
      } else {
        await createSpu(payload);
        message.success('创建成功');
      }
      history.push('/shop-workspace/shop-product-dir/shop-product-list');
    } catch (error) {
      if (error instanceof Error && error.message === 'empty-spec') {
        message.error('每个 SKU 至少需要填写一组完整规格');
        return;
      }
      throw error;
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer title={editId ? '编辑商品' : '新增商品'}>
      <Spin spinning={loading}>
        <Form form={form} layout="vertical">
          <Card title="基本信息" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="商品名称"
                  rules={[{ required: true, message: '请输入商品名称' }]}
                >
                  <Input placeholder="请输入商品名称" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="subtitle" label="副标题">
                  <Input placeholder="请输入副标题" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="categoryId"
                  label="商品分类"
                  rules={[{ required: true, message: '请选择商品分类' }]}
                >
                  <TreeSelect
                    treeData={categoryTree}
                    placeholder="请选择分类"
                    allowClear
                    treeDefaultExpandAll
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="keyword" label="搜索关键词">
                  <Input placeholder="多个关键词用逗号分隔" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="图片信息" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="mainImage"
                  label="主图"
                  rules={[{ required: true, message: '请上传主图' }]}
                >
                  <ImageUpload buttonText="上传主图" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="images" label="轮播图">
                  <ImageGalleryUpload />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="商品描述" style={{ marginBottom: 16 }}>
            <Form.Item name="description" label="简要描述">
              <Input.TextArea rows={3} placeholder="请输入商品简要描述" />
            </Form.Item>
            <Form.Item name="detailContent" label="详细内容">
              <RichTextEditor placeholder="请输入商品详情，支持上传图片到 MinIO" />
            </Form.Item>
          </Card>

          <Card title="SKU 规格" style={{ marginBottom: 16 }}>
            <Form.List name="skuList">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Card
                      key={key}
                      size="small"
                      style={{ marginBottom: 8 }}
                      extra={
                        <MinusCircleOutlined
                          style={{ color: 'red' }}
                          onClick={() => remove(name)}
                        />
                      }
                    >
                      <Row gutter={12}>
                        <Col span={24}>
                          <Form.Item label="规格属性" required>
                            <Form.List name={[name, 'attributes']}>
                              {(attributeFields, attributeOps) => (
                                <>
                                  {attributeFields.map((attributeField, attributeIndex) => (
                                    <Space
                                      key={attributeField.key}
                                      align="baseline"
                                      style={{ display: 'flex', marginBottom: 8 }}
                                    >
                                      <Form.Item
                                        {...attributeField}
                                        name={[attributeField.name, 'key']}
                                        rules={[{ required: true, message: '请输入规格名' }]}
                                      >
                                        <Input
                                          placeholder={attributeIndex === 0 ? '如：颜色' : '规格名'}
                                        />
                                      </Form.Item>
                                      <Form.Item
                                        {...attributeField}
                                        name={[attributeField.name, 'value']}
                                        rules={[{ required: true, message: '请输入规格值' }]}
                                      >
                                        <Input
                                          placeholder={attributeIndex === 0 ? '如：红色' : '规格值'}
                                        />
                                      </Form.Item>
                                      {attributeFields.length > 1 ? (
                                        <MinusCircleOutlined
                                          onClick={() => attributeOps.remove(attributeField.name)}
                                        />
                                      ) : null}
                                    </Space>
                                  ))}
                                  <Button
                                    type="dashed"
                                    onClick={() => attributeOps.add({ key: '', value: '' })}
                                    icon={<PlusOutlined />}
                                  >
                                    添加规格属性
                                  </Button>
                                </>
                              )}
                            </Form.List>
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item
                            {...restField}
                            name={[name, 'price']}
                            label="销售价"
                            rules={[{ required: true, message: '请输入销售价' }]}
                          >
                            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item {...restField} name={[name, 'originalPrice']} label="原价">
                            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item {...restField} name={[name, 'costPrice']} label="成本价">
                            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item
                            {...restField}
                            name={[name, 'stock']}
                            label="库存"
                            rules={[{ required: true, message: '请输入库存' }]}
                          >
                            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item {...restField} name={[name, 'stockWarning']} label="库存预警">
                            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item {...restField} name={[name, 'weight']} label="重量(g)">
                            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item {...restField} name={[name, 'skuCode']} label="SKU编码">
                            <Input placeholder="可选" />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item {...restField} name={[name, 'image']} label="SKU图片">
                            <ImageUpload buttonText="上传SKU图" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>
                  ))}
                  <Button
                    type="dashed"
                    onClick={() => add(createEmptySku())}
                    block
                    icon={<PlusOutlined />}
                  >
                    添加 SKU
                  </Button>
                </>
              )}
            </Form.List>
          </Card>

          <Space>
            <Button type="primary" onClick={handleSave} loading={saving}>
              保存草稿
            </Button>
            <Button
              onClick={() =>
                history.push('/shop-workspace/shop-product-dir/shop-product-list')
              }
            >
              返回列表
            </Button>
          </Space>
        </Form>
      </Spin>
    </PageContainer>
  );
};

export default ShopProductCreatePage;
