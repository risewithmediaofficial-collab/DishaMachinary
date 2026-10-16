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
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '22px 24px',
          marginBottom: 24,
          boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 18,
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 800,
              }}
            >
              ⚡
            </div>
            <div>
              <span style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>Quick Stock Adjustment</span>
              <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>
                Instantly record warehouse stock in or stock out
              </span>
            </div>
          </div>
          <Tag color="blue" style={{ fontWeight: 700, borderRadius: 10 }}>Audit Logged</Tag>
        </div>

        <Form form={form} layout="vertical" onFinish={submitAdjustment}>
          <Row gutter={[14, 12]} align="bottom">
            {/* PRODUCT SELECTOR */}
            <Col xs={24} sm={24} md={10} lg={9}>
              <Form.Item
                name="productId"
                label={<span style={{ fontWeight: 700, fontSize: 12.5, color: '#334155' }}>Select Product / Machine</span>}
                rules={[{ required: true, message: 'Please select a product' }]}
                style={{ marginBottom: 0 }}
              >
                <Select
                  showSearch
                  size="large"
                  placeholder="Search by name, SKU or model..."
                  value={productId}
                  onChange={(val) => {
                    setProductId(val);
                    form.setFieldsValue({ productId: val });
                  }}
                  filterOption={(input, option) => {
                    const q = (input || '').toLowerCase().trim();
                    return option?.searchStr && option.searchStr.toLowerCase().includes(q);
                  }}
                  options={products.map((p) => {
                    const avail = Number(p.stockQuantity || 0) - Number(p.reservedQuantity || 0);
                    return {
                      value: p._id,
                      searchStr: `${p.name} ${p.sku} ${p.modelNumber || ''}`,
                      label: (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{p.name}</span>
                          <span style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>
                            <Tag color="blue" style={{ margin: 0, padding: '0 4px', fontSize: 11, borderRadius: 4 }}>
                              {p.sku}
                            </Tag>{' '}
                            Avail: <strong style={{ color: avail > 0 ? '#16a34a' : '#dc2626' }}>{avail}</strong>
                          </span>
                        </div>
                      ),
                    };
                  })}
                  style={{ width: '100%', borderRadius: 8 }}
                />
              </Form.Item>
            </Col>

            {/* ACTION TYPE */}
            <Col xs={24} sm={12} md={4} lg={3}>
              <Form.Item
                name="direction"
                label={<span style={{ fontWeight: 700, fontSize: 12.5, color: '#334155' }}>Action</span>}
                initialValue="in"
                rules={[{ required: true }]}
                style={{ marginBottom: 0 }}
              >
                <Select
                  size="large"
                  options={[
                    { value: 'in', label: '📥 Stock In (+)' },
                    { value: 'out', label: '📤 Stock Out (-)' },
                  ]}
                  style={{ width: '100%', borderRadius: 8 }}
                />
              </Form.Item>
            </Col>

            {/* QUANTITY */}
            <Col xs={24} sm={12} md={3} lg={3}>
              <Form.Item
                name="quantity"
                label={<span style={{ fontWeight: 700, fontSize: 12.5, color: '#334155' }}>Quantity</span>}
                rules={[{ required: true, message: 'Enter quantity' }]}
                style={{ marginBottom: 0 }}
              >
                <InputNumber
                  size="large"
                  min={1}
                  step={1}
                  placeholder="Units"
                  style={{ width: '100%', borderRadius: 8 }}
                />
              </Form.Item>
            </Col>

            {/* REASON / NOTE */}
            <Col xs={24} sm={16} md={5} lg={6}>
              <Form.Item
                name="note"
                label={<span style={{ fontWeight: 700, fontSize: 12.5, color: '#334155' }}>Reason / Note</span>}
                style={{ marginBottom: 0 }}
              >
                <Input
                  size="large"
                  maxLength={180}
                  placeholder="e.g. Shipment arrival / Return"
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>
            </Col>

            {/* SUBMIT BUTTON */}
            <Col xs={24} sm={8} md={2} lg={3}>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={loading}
                  style={{
                    width: '100%',
                    fontWeight: 700,
                    borderRadius: 8,
                    height: 40,
                    background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                  }}
                >
                  Adjust
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>

      {/* STOCK LEVELS TABLE */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          padding: '22px 24px',
          boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                Current Stock Levels
              </h2>
              <Tag color="blue" style={{ borderRadius: 10, fontWeight: 700, margin: 0 }}>
                {filteredProducts.length} of {products.length} Products
              </Tag>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#64748b' }}>
              Real-time on-hand, reserved, and available quantities across the product catalog
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Input
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Search product name, SKU or model..."
              value={stockSearch}
              onChange={(e) => setStockSearch(e.target.value)}
              allowClear
              size="middle"
              style={{ width: 270, borderRadius: 8 }}
            />

            <Radio.Group
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              buttonStyle="solid"
              size="middle"
            >
              <Radio.Button value="all" style={{ borderRadius: '8px 0 0 8px' }}>
                All ({products.length})
              </Radio.Button>
              <Radio.Button value="in_stock">
                In Stock ({stockStats.inStock})
              </Radio.Button>
              <Radio.Button value="low_stock">
                Low Stock ({stockStats.lowStock})
              </Radio.Button>
              <Radio.Button value="out_of_stock" style={{ borderRadius: '0 8px 8px 0' }}>
                Out of Stock ({stockStats.outOfStock})
              </Radio.Button>
            </Radio.Group>
          </div>
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
