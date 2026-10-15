import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Button, Form, Input, InputNumber, Select, Table, Tag, message } from 'antd';
import SelectAsync from '@/components/SelectAsync';
import { request } from '@/request';

const columns = [
  { title: 'Date', dataIndex: 'created', render: (value) => dayjs(value).format('DD/MM/YYYY HH:mm') },
  { title: 'Product', dataIndex: 'productName' },
  { title: 'SKU', dataIndex: 'sku' },
  { title: 'Movement', dataIndex: 'type' },
  { title: 'Change', dataIndex: 'delta' },
  { title: 'Before', dataIndex: 'stockBefore' },
  { title: 'After', dataIndex: 'stockAfter' },
  { title: 'Note', dataIndex: 'note' },
];

const stockColumns = [
  { title: 'Product', dataIndex: 'name' },
  { title: 'SKU', dataIndex: 'sku' },
  {
    title: 'On hand',
    dataIndex: 'stockQuantity',
    render: (quantity, product) => `${Number(quantity || 0)} ${product.unit || 'piece'}`,
  },
  { title: 'Reserved', dataIndex: 'reservedQuantity', render: (quantity) => Number(quantity || 0) },
  {
    title: 'Available',
    render: (_, product) => {
      const available = Math.max(
        0,
        Number(product.stockQuantity || 0) -
          Number(product.reservedQuantity || 0) -
          Number(product.damagedQuantity || 0)
      );
      return <Tag color={available <= Number(product.reorderLevel || 0) ? 'red' : 'green'}>{available}</Tag>;
    },
  },
];

export default function Inventory() {
  const [form] = Form.useForm();
  const [productId, setProductId] = useState();
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadProducts = async () => {
    setProductsLoading(true);
    const response = await request.listAll({ entity: 'product' });
    setProducts(response?.success && Array.isArray(response.result) ? response.result : []);
    setProductsLoading(false);
  };

  const loadMovements = async (id) => {
    if (!id) {
      setMovements([]);
      return;
    }
    const response = await request.get({ entity: `product/${id}/stock-movements` });
    setMovements(response.success ? response.result : []);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    loadMovements(productId);
  }, [productId]);

  const submitAdjustment = async (values) => {
    if (!productId) {
      message.error('Select a product first.');
      return;
    }
    setLoading(true);
    const response = await request.post({
      entity: 'product/adjust-stock',
      jsonData: { ...values, productId },
    });
    setLoading(false);
    if (response.success) {
      message.success('Stock updated.');
      form.resetFields(['quantity', 'note']);
      await Promise.all([loadProducts(), loadMovements(productId)]);
    } else {
      message.error(response?.message || 'Stock could not be updated.');
    }
  };

  return (
    <div className="whiteBox shadow layoutPadding" style={{ margin: '16px auto', borderRadius: 12 }}>
      <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Inventory & Stock Management</h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
          Track warehouse stock on hand, record manual stock adjustments, and view movement audit logs
        </p>
      </div>

      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px 20px', marginBottom: 28 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          Record Quick Stock Adjustment
        </div>
        <Form form={form} layout="inline" onFinish={submitAdjustment} style={{ gap: '12px 16px' }}>
          <Form.Item label="Product" required style={{ margin: 0 }}>
            <SelectAsync
              entity="product"
              displayLabels={['name', 'sku']}
              placeholder="Search product by name or code..."
              style={{ width: 340, minWidth: 280 }}
              onChange={setProductId}
            />
          </Form.Item>
          <Form.Item name="direction" label="Action" initialValue="in" rules={[{ required: true }]} style={{ margin: 0 }}>
            <Select
              options={[
                { value: 'in', label: '📥 Stock in' },
                { value: 'out', label: '📤 Stock out' },
              ]}
              style={{ width: 130 }}
            />
          </Form.Item>
          <Form.Item name="quantity" label="Qty" rules={[{ required: true, message: 'Enter quantity' }]} style={{ margin: 0 }}>
            <InputNumber min={0.01} step={1} placeholder="Quantity" style={{ width: 110 }} />
          </Form.Item>
          <Form.Item name="note" label="Reason" style={{ margin: 0 }}>
            <Input maxLength={240} placeholder="e.g. Restock / Damaged / Return" style={{ width: 240 }} />
          </Form.Item>
          <Form.Item style={{ margin: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading}>
              Record Movement
            </Button>
          </Form.Item>
        </Form>
      </div>

      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Current Stock Levels</h2>
          <span style={{ fontSize: 12, color: '#64748b' }}>{products.length} products in catalog</span>
        </div>
        <Table
          rowKey="_id"
          columns={stockColumns}
          dataSource={products}
          loading={productsLoading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: 'No products in the catalog yet' }}
        />
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
            {productId ? 'Stock Movement History (Filtered)' : 'Recent Stock Movements'}
          </h2>
          {productId && (
            <Button size="small" type="link" onClick={() => setProductId(undefined)}>
              Clear filter
            </Button>
          )}
        </div>
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={movements}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: productId ? 'No stock movements for this product yet' : 'Select a product to view movement history' }}
        />
      </div>
    </div>
  );
}
