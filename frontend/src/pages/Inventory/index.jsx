import { useEffect, useState, useMemo, useRef } from 'react';
import dayjs from 'dayjs';
import {
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  InboxOutlined,
  SearchOutlined,
  ReloadOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { request } from '@/request';

export default function Inventory() {
  const [form] = Form.useForm();
  const [productId, setProductId] = useState();
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [movements, setMovements] = useState([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stockSearch, setStockSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const adjustmentFormRef = useRef(null);

  const loadProducts = async () => {
    setProductsLoading(true);
    let items = [];
    const allRes = await request.listAll({ entity: 'product' });
    if (allRes?.success && Array.isArray(allRes.result) && allRes.result.length > 0) {
      items = allRes.result;
    } else {
      const listRes = await request.list({ entity: 'product', options: { page: 1, items: 1000 } });
      if (listRes?.success && Array.isArray(listRes.result)) {
        items = listRes.result;
      }
    }
    // Sort products alphabetically by name
    items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    setProducts(items);
    setProductsLoading(false);
  };

  const loadMovements = async (id) => {
    if (!id) {
      setMovements([]);
      return;
    }
    setMovementsLoading(true);
    const response = await request.get({ entity: `product/${id}/stock-movements` });
    setMovements(response.success && Array.isArray(response.result) ? response.result : []);
    setMovementsLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    loadMovements(productId);
  }, [productId]);

  const handleSelectProductForAdjust = (id) => {
    setProductId(id);
    form.setFieldsValue({ productId: id });
    if (adjustmentFormRef.current) {
      adjustmentFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const submitAdjustment = async (values) => {
    const targetProductId = values.productId || productId;
    if (!targetProductId) {
      message.error('Select a product first.');
      return;
    }
    setLoading(true);
    const response = await request.post({
      entity: 'product/adjust-stock',
      jsonData: { ...values, productId: targetProductId },
    });
    setLoading(false);
    if (response.success) {
      message.success('Stock quantity updated successfully.');
      form.resetFields(['quantity', 'note']);
      await Promise.all([loadProducts(), loadMovements(targetProductId)]);
    } else {
      message.error(response?.message || 'Stock could not be updated.');
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = stockSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.modelNumber && p.modelNumber.toLowerCase().includes(q)) ||
        (p.category && String(p.category).toLowerCase().includes(q));

      if (!matchesSearch) return false;

      const available =
        Number(p.stockQuantity || 0) -
        Number(p.reservedQuantity || 0) -
        Number(p.damagedQuantity || 0);

      const reorderLevel = Number(p.reorderLevel || 0);

      if (statusFilter === 'in_stock') return available > reorderLevel;
      if (statusFilter === 'low_stock') return available > 0 && available <= reorderLevel;
      if (statusFilter === 'out_of_stock') return available <= 0;

      return true;
    });
  }, [products, stockSearch, statusFilter]);

  const stockStats = useMemo(() => {
    let totalItems = products.length;
    let totalOnHand = 0;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    products.forEach((p) => {
      const onHand = Number(p.stockQuantity || 0);
      const available = onHand - Number(p.reservedQuantity || 0) - Number(p.damagedQuantity || 0);
      const reorderLevel = Number(p.reorderLevel || 0);
      totalOnHand += onHand;

      if (available <= 0) {
        outOfStock++;
      } else if (available <= reorderLevel) {
        lowStock++;
      } else {
        inStock++;
      }
    });

    return { totalItems, totalOnHand, inStock, lowStock, outOfStock };
  }, [products]);

  const stockColumns = [
    {
      title: 'Machine / Product',
      dataIndex: 'name',
      key: 'name',
      render: (name, p) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5 }}>{name}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            SKU: <strong style={{ color: '#0284c7' }}>{p.sku}</strong>
            {p.modelNumber ? ` · Model: ${p.modelNumber}` : ''}
            {p.category ? ` · Category: ${p.category?.name || p.category}` : ''}
          </div>
        </div>
      ),
    },
    {
      title: 'Stock On Hand',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      align: 'right',
      render: (quantity, p) => (
        <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
          {Number(quantity || 0).toLocaleString('en-IN')}{' '}
          <span style={{ fontSize: 11, fontWeight: 500, color: '#64748b' }}>{p.unit || 'pcs'}</span>
        </span>
      ),
    },
    {
      title: 'Reserved',
      dataIndex: 'reservedQuantity',
      key: 'reservedQuantity',
      align: 'right',
      render: (quantity) => (
        <span style={{ color: Number(quantity || 0) > 0 ? '#ea580c' : '#94a3b8', fontWeight: 600 }}>
          {Number(quantity || 0)}
        </span>
      ),
    },
    {
      title: 'Available',
      key: 'available',
      align: 'right',
      render: (_, p) => {
        const available = Math.max(
          0,
          Number(p.stockQuantity || 0) -
            Number(p.reservedQuantity || 0) -
            Number(p.damagedQuantity || 0)
        );
        return (
          <span style={{ fontWeight: 800, fontSize: 14.5, color: available > 0 ? '#16a34a' : '#dc2626' }}>
            {available.toLocaleString('en-IN')}
          </span>
        );
      },
    },
    {
      title: 'Stock Status',
      key: 'status',
      align: 'center',
      render: (_, p) => {
        const available = Math.max(
          0,
          Number(p.stockQuantity || 0) -
            Number(p.reservedQuantity || 0) -
            Number(p.damagedQuantity || 0)
        );
        const reorderLevel = Number(p.reorderLevel || 0);

        if (available <= 0) {
          return (
            <Tag color="red" style={{ fontWeight: 600, borderRadius: 12, padding: '2px 8px' }}>
              <CloseCircleOutlined /> Out of Stock
            </Tag>
          );
        }
        if (available <= reorderLevel) {
          return (
            <Tag color="orange" style={{ fontWeight: 600, borderRadius: 12, padding: '2px 8px' }}>
              <WarningOutlined /> Low Stock
            </Tag>
          );
        }
        return (
          <Tag color="green" style={{ fontWeight: 600, borderRadius: 12, padding: '2px 8px' }}>
            <CheckCircleOutlined /> In Stock
          </Tag>
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      render: (_, p) => (
        <Button
          size="small"
          type="primary"
          ghost
          style={{ borderRadius: 6, fontWeight: 600 }}
          onClick={() => handleSelectProductForAdjust(p._id)}
        >
          Quick Adjust
        </Button>
      ),
    },
  ];

  const movementColumns = [
    {
      title: 'Date & Time',
      dataIndex: 'created',
      width: 140,
      render: (value) => dayjs(value).format('DD/MM/YYYY HH:mm'),
    },
    { title: 'Product', dataIndex: 'productName', render: (text, r) => text || r.sku },
    {
      title: 'Type',
      dataIndex: 'type',
      width: 110,
      render: (type) => {
        const isAdd = ['in', 'manual_add', 'restock'].includes(type);
        return (
          <Tag color={isAdd ? 'green' : 'blue'} style={{ textTransform: 'uppercase', fontWeight: 600 }}>
            {type}
          </Tag>
        );
      },
    },
    {
      title: 'Change',
      dataIndex: 'delta',
      align: 'right',
      width: 90,
      render: (delta) => {
        const n = Number(delta || 0);
        return (
          <span style={{ fontWeight: 700, color: n >= 0 ? '#16a34a' : '#dc2626' }}>
            {n > 0 ? `+${n}` : n}
          </span>
        );
      },
    },
    {
      title: 'Stock Before',
      dataIndex: 'stockBefore',
      align: 'right',
      width: 100,
      render: (val) => Number(val || 0),
    },
    {
      title: 'Stock After',
      dataIndex: 'stockAfter',
      align: 'right',
      width: 100,
      render: (val) => <strong>{Number(val || 0)}</strong>,
    },
    { title: 'Reason / Note', dataIndex: 'note', render: (note) => note || <span style={{ color: '#94a3b8' }}>-</span> },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '16px' }}>
      {/* HEADER BAR */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 16,
          padding: '20px 24px',
          border: '1px solid #e2e8f0',
          marginBottom: 20,
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb',
                fontSize: 18,
              }}
            >
              <InboxOutlined />
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Inventory & Warehouse Stock
            </h1>
            <Tag color="blue" style={{ fontWeight: 700, borderRadius: 12, marginLeft: 4 }}>
              All {products.length} Products
            </Tag>
          </div>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
            Live stock balance, manual restock / deduction, and real-time movement audit trails
          </p>
        </div>

        <Button
          icon={<ReloadOutlined />}
          style={{ background: '#ffffff', color: '#334155', border: '1px solid #cbd5e1', borderRadius: 8, fontWeight: 600 }}
          onClick={loadProducts}
          loading={productsLoading}
        >
          Refresh Stock
        </Button>
      </div>

      {/* QUICK SUMMARY CARDS */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Products</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginTop: 4 }}>{stockStats.totalItems}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Units On Hand</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#2563eb', marginTop: 4 }}>
              {stockStats.totalOnHand.toLocaleString('en-IN')}
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, textTransform: 'uppercase' }}>In Stock Items</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#16a34a', marginTop: 4 }}>{stockStats.inStock}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, textTransform: 'uppercase' }}>Out / Low Stock</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: stockStats.outOfStock > 0 ? '#dc2626' : '#64748b', marginTop: 4 }}>
              {stockStats.outOfStock + stockStats.lowStock}
            </div>
          </Card>
        </Col>
      </Row>

      {/* QUICK ADJUSTMENT FORM */}
      <div
        ref={adjustmentFormRef}
        style={{
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: 14,
          padding: '20px 24px',
          marginBottom: 24,
          boxShadow: '0 4px 12px -2px rgba(15, 23, 42, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Tag color="blue" style={{ fontWeight: 800, padding: '2px 8px' }}>QUICK ADJUSTMENT</Tag>
          <span style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>Record Stock In / Stock Out</span>
        </div>

        <Form form={form} layout="inline" onFinish={submitAdjustment} style={{ gap: '14px 16px', alignItems: 'flex-start' }}>
          <Form.Item
            name="productId"
            label="Product"
            rules={[{ required: true, message: 'Select product' }]}
            style={{ margin: 0, minWidth: 320, flex: 1 }}
          >
            <Select
              showSearch
              placeholder="Search and select product from all catalog items..."
              value={productId}
              onChange={(val) => {
                setProductId(val);
                form.setFieldsValue({ productId: val });
              }}
              filterOption={(input, option) => {
                const q = (input || '').toLowerCase().trim();
                return (
                  (option?.label && option.label.toLowerCase().includes(q)) ||
                  (option?.sku && option.sku.toLowerCase().includes(q))
                );
              }}
              options={products.map((p) => ({
                value: p._id,
                label: `${p.name} · SKU: ${p.sku} (Available: ${Number(p.stockQuantity || 0) - Number(p.reservedQuantity || 0)})`,
                sku: p.sku,
              }))}
            />
          </Form.Item>

          <Form.Item name="direction" label="Action" initialValue="in" rules={[{ required: true }]} style={{ margin: 0, width: 145 }}>
            <Select
              options={[
                { value: 'in', label: '📥 Stock In (Add)' },
                { value: 'out', label: '📤 Stock Out (Deduct)' },
              ]}
            />
          </Form.Item>

          <Form.Item name="quantity" label="Qty" rules={[{ required: true, message: 'Enter quantity' }]} style={{ margin: 0, width: 110 }}>
            <InputNumber min={1} step={1} placeholder="Quantity" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="note" label="Reason" style={{ margin: 0, width: 220 }}>
            <Input maxLength={180} placeholder="e.g. Restock / Return" />
          </Form.Item>

          <Form.Item style={{ margin: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading} style={{ fontWeight: 700, borderRadius: 6, height: 36 }}>
              Record Adjustment
            </Button>
          </Form.Item>
        </Form>
      </div>

      {/* STOCK LEVELS TABLE */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          padding: '20px 24px',
          boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
              Current Stock Levels ({filteredProducts.length} of {products.length})
            </h2>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Displays all machines and spares added to the product catalog
            </span>
          </div>

          <Space size="middle" wrap>
            <Input
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Filter by product name, SKU or model..."
              value={stockSearch}
              onChange={(e) => setStockSearch(e.target.value)}
              allowClear
              style={{ width: 280, borderRadius: 8 }}
            />

            <Radio.Group
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              buttonStyle="solid"
              size="middle"
            >
              <Radio.Button value="all">All</Radio.Button>
              <Radio.Button value="in_stock">In Stock ({stockStats.inStock})</Radio.Button>
              <Radio.Button value="low_stock">Low Stock ({stockStats.lowStock})</Radio.Button>
              <Radio.Button value="out_of_stock">Out of Stock ({stockStats.outOfStock})</Radio.Button>
            </Radio.Group>
          </Space>
        </div>

        <Table
          rowKey="_id"
          columns={stockColumns}
          dataSource={filteredProducts}
          loading={productsLoading}
          pagination={{
            pageSize: 25,
            showSizeChanger: true,
            pageSizeOptions: ['10', '25', '50', '100', '500'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} products`,
          }}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: 'No products matching search criteria' }}
        />
      </div>

      {/* STOCK AUDIT HISTORY */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          padding: '20px 24px',
          boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <HistoryOutlined style={{ color: '#2563eb', fontSize: 18 }} />
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
              {productId
                ? `Stock Movement History for Selected Product`
                : 'Recent Stock Movement Audit Trail'}
            </h2>
          </div>
          {productId && (
            <Button
              size="small"
              onClick={() => {
                setProductId(undefined);
                form.resetFields(['productId']);
              }}
            >
              Clear Filter (Show All)
            </Button>
          )}
        </div>

        <Table
          rowKey="_id"
          columns={movementColumns}
          dataSource={movements}
          loading={movementsLoading}
          pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '25', '50'] }}
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: productId
              ? 'No movements recorded yet for this product'
              : 'Select any product above to view its stock movement history',
          }}
        />
      </div>
    </div>
  );
}
