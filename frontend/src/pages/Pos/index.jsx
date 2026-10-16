import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  AutoComplete,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Table,
  Typography,
  Tag,
  Divider,
} from 'antd';
import {
  PrinterOutlined,
  BarcodeOutlined,
  FilePdfOutlined,
  CheckCircleFilled,
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import AutoCompleteAsync from '@/components/AutoCompleteAsync';
import { request } from '@/request';
import { useMoney } from '@/settings';
import { selectFinanceSettings } from '@/redux/settings/selectors';
import { useSelector } from 'react-redux';
import { DOWNLOAD_BASE_URL } from '@/config/serverApiConfig';

export default function Pos() {
  const navigate = useNavigate();
  const { currency_code } = useMoney();
  const { last_invoice_number } = useSelector(selectFinanceSettings);
  const [form] = Form.useForm();
  const [customerForm] = Form.useForm();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [gstEnabled, setGstEnabled] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [billSuccessModalOpen, setBillSuccessModalOpen] = useState(false);
  const [lastCreatedInvoice, setLastCreatedInvoice] = useState(null);
  const loadProducts = () => {
    request.list({ entity: 'product', options: { page: 1, items: 100 } }).then((response) => {
      setProducts(response?.success && Array.isArray(response.result) ? response.result : []);
    });
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const subTotal = useMemo(
    () => Number(cart.reduce((sum, line) => sum + line.quantity * line.product.sellingPrice, 0).toFixed(2)),
    [cart]
  );
  const discount = Number(Form.useWatch('discount', form) || 0);
  const rawTaxTotal = useMemo(
    () =>
      gstEnabled
        ? Number(
            cart
              .reduce(
                (sum, line) =>
                  sum + (line.quantity * line.product.sellingPrice * (line.product.gstRate || 0)) / 100,
                0
              )
              .toFixed(2)
          )
        : 0,
    [cart, gstEnabled]
  );
  const safeDiscount = Math.min(Math.max(discount, 0), subTotal);
  const taxTotal = Number((rawTaxTotal * (subTotal ? (subTotal - safeDiscount) / subTotal : 0)).toFixed(2));
  const total = Math.max(0, Number((subTotal - safeDiscount + taxTotal).toFixed(2)));
  const paidNow = Number(Form.useWatch('paidNow', form) || 0);

  const addProduct = (value) => {
    const product = products.find((item) => item._id === value);
    if (!product) return;
    const available = Number(product.stockQuantity || 0) - Number(product.reservedQuantity || 0);
    if (product.trackInventory && available <= 0) {
      message.error(`${product.name} is out of stock.`);
      return;
    }
    setCart((current) => {
      const existing = current.find((line) => line.product._id === product._id);
      if (existing) {
        if (product.trackInventory && existing.quantity >= available) {
          message.error('Quantity exceeds available stock.');
          return current;
        }
        return current.map((line) =>
          line.product._id === product._id ? { ...line, quantity: line.quantity + 1 } : line
        );
      }
      return [...current, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (!quantity) return;
    setCart((current) =>
      current.map((line) => (line.product._id === productId ? { ...line, quantity } : line))
    );
  };

  const updatePrice = (productId, price) => {
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) return;
    setCart((current) =>
      current.map((line) =>
        line.product._id === productId
          ? { ...line, product: { ...line.product, sellingPrice: numPrice } }
          : line
      )
    );
  };

  const createQuickCustomer = async (values) => {
    setCreatingCustomer(true);
    const response = await request.create({
      entity: 'client',
      jsonData: { name: values.name.trim(), phone: values.phone.trim() },
    });
    setCreatingCustomer(false);
    if (!response?.success) return;
    form.setFieldsValue({ client: response.result._id });
    customerForm.resetFields();
    setCustomerModalOpen(false);
    message.success(`${response.result.name} selected for this bill.`);
  };

  const resetBillingState = () => {
    setCart([]);
    form.resetFields();
    setLastCreatedInvoice(null);
    setBillSuccessModalOpen(false);
  };

  const checkout = async (values) => {
    if (!cart.length) return message.error('Add at least one product to the bill.');
    if (values.paidNow > total) return message.error('Payment cannot exceed the bill total.');
    setLoading(true);
    setError('');
    const invoiceResponse = await request.create({
      entity: 'invoice',
      jsonData: {
        client: values.client,
        number: Number(last_invoice_number || 0) + 1,
        year: dayjs().year(),
        status: 'posted',
        date: dayjs().toISOString(),
        expiredDate: dayjs().toISOString(),
        currency: currency_code || 'INR',
        notes: values.notes || '',
        discount,
        gstEnabled,
        paidNow: values.paidNow !== undefined ? values.paidNow : total,
        paymentMethod: paymentMethod || 'cash',
        items: cart.map(({ product, quantity }) => ({
          product: product._id,
          itemName: product.name,
          description: product.description || '',
          quantity,
          price: product.sellingPrice,
          gstRate: product.gstRate || 0,
        })),
      },
    });
    if (!invoiceResponse?.success) {
      setLoading(false);
      setError(invoiceResponse?.message || 'Could not create bill.');
      return;
    }

    const invoice = invoiceResponse.result;
    setLoading(false);
    message.success(`Bill #${invoice.number}/${invoice.year} created and recorded in payments.`);
    setLastCreatedInvoice(invoice);
    setBillSuccessModalOpen(true);
  };

  return (
    <main className="pos-page">
      <Row className="pos-page-header" justify="space-between" align="middle" style={{ marginBottom: 18 }}>
        <Col>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Typography.Title level={3} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
              POS Billing Counter
            </Typography.Title>
            <Tag color="blue" style={{ fontWeight: 600, borderRadius: 6 }}>
              Disha Machinary
            </Tag>
          </div>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            Search machinery products, configure GST, and print Thermal (80mm) or A4 bills instantly
          </Typography.Text>
        </Col>
        <Col>
          <Space>
            <Button onClick={() => navigate('/invoice')}>All Invoices</Button>
            {cart.length > 0 && (
              <Button danger onClick={() => setCart([])}>
                Clear Cart
              </Button>
            )}
          </Space>
        </Col>
      </Row>

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16, borderRadius: 8 }} />}

      <div className="pos-workspace">
        <section className="pos-products-pane">
          <Card
            className="pos-panel"
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShoppingCartOutlined style={{ color: '#2563eb' }} />
                <span>Selected Items ({cart.length})</span>
              </div>
            }
          >
            <AutoComplete
              style={{ width: '100%', marginBottom: 16 }}
              placeholder="Search machine, tool, spare SKU or barcode..."
              options={products.map((product) => ({
                value: product._id,
                label: `${product.name} · SKU: ${product.sku} · ${
                  product.modelNumber ? 'Model: ' + product.modelNumber : ''
                } · ₹${Number(product.sellingPrice).toLocaleString('en-IN')} · (${
                  Number(product.stockQuantity || 0) - Number(product.reservedQuantity || 0)
                } in stock)`,
              }))}
              filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
              onSelect={addProduct}
              value=""
            />

            <Table
              rowKey={(product) => product._id}
              dataSource={cart.map((line) => ({ ...line.product, quantity: line.quantity }))}
              pagination={false}
              scroll={{ x: 'max-content' }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Search and select machinery products above to add to bill"
                  />
                ),
              }}
              columns={[
                {
                  title: 'Machine / Item',
                  dataIndex: 'name',
                  render: (name, product) => (
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{name}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>SKU: {product.sku}</div>
                    </div>
                  ),
                },
                {
                  title: 'Price (₹)',
                  dataIndex: 'sellingPrice',
                  align: 'right',
                  render: (value, product) => (
                    <InputNumber
                      min={0}
                      precision={2}
                      value={value}
                      onChange={(price) => updatePrice(product._id, price)}
                      style={{ width: 105 }}
                    />
                  ),
                },
                {
                  title: 'GST %',
                  dataIndex: 'gstRate',
                  align: 'center',
                  render: (value) => (gstEnabled ? `${value || 0}%` : '0% (Exempt)'),
                },
                {
                  title: 'Qty',
                  dataIndex: 'quantity',
                  align: 'center',
                  render: (value, product) => (
                    <InputNumber
                      min={1}
                      max={
                        product.trackInventory
                          ? Number(product.stockQuantity || 0) - Number(product.reservedQuantity || 0)
                          : undefined
                      }
                      value={value}
                      onChange={(quantity) => updateQuantity(product._id, quantity)}
                      style={{ width: 68 }}
                    />
                  ),
                },
                {
                  title: 'Line Total',
                  align: 'right',
                  render: (_, product) => (
                    <strong style={{ color: '#0f172a' }}>
                      ₹ {(product.quantity * product.sellingPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </strong>
                  ),
                },
                {
                  title: '',
                  width: 50,
                  render: (_, product) => (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => setCart((current) => current.filter((line) => line.product._id !== product._id))}
                    />
                  ),
                },
              ]}
            />
          </Card>
        </section>

        <aside className="pos-checkout-pane">
          <Card className="pos-panel" title="Checkout & Payment">
            <Form form={form} layout="vertical" onFinish={checkout}>
              <Form.Item name="client" label="Customer" rules={[{ required: true, message: 'Select a customer' }]}>
                <AutoCompleteAsync entity="client" displayLabels={['name', 'phone']} searchFields="name,phone" />
              </Form.Item>
              <Button
                type="dashed"
                block
                onClick={() => setCustomerModalOpen(true)}
                style={{ marginTop: -8, marginBottom: 16, borderRadius: 6, fontSize: 12.5 }}
              >
                + Quick Add Customer (Name & Mobile)
              </Button>

              <Form.Item label="Bill Tax Mode">
                <Radio.Group
                  value={gstEnabled ? 'gst' : 'no-gst'}
                  onChange={(event) => setGstEnabled(event.target.value === 'gst')}
                  optionType="button"
                  buttonStyle="solid"
                  style={{ width: '100%', display: 'flex' }}
                >
                  <Radio.Button value="gst" style={{ flex: 1, textAlign: 'center' }}>
                    GST Tax Invoice
                  </Radio.Button>
                  <Radio.Button value="no-gst" style={{ flex: 1, textAlign: 'center' }}>
                    Retail Bill (No GST)
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Row gutter={10}>
                <Col span={12}>
                  <Form.Item name="discount" label="Discount (₹)">
                    <InputNumber min={0} max={subTotal} precision={2} placeholder="0.00" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="paidNow" label="Paid Now (₹)">
                    <InputNumber min={0} max={total} precision={2} placeholder="0.00" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Payment Method">
                <Select
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  options={[
                    { value: 'cash', label: '💵 Cash' },
                    { value: 'upi', label: '📱 UPI (GPay / PhonePe)' },
                    { value: 'card', label: '💳 Card' },
                    { value: 'bank_transfer', label: '🏦 Bank Transfer' },
                  ]}
                />
              </Form.Item>

              <Form.Item name="notes" label="Notes / Remarks">
                <Input placeholder="Optional bill remarks..." />
              </Form.Item>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '14px 16px',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <Typography.Text type="secondary">Subtotal:</Typography.Text>
                  <strong>₹ {subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </div>
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: '#b91c1c' }}>
                    <span>Discount:</span>
                    <strong>- ₹ {discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                  <Typography.Text type="secondary">GST Tax:</Typography.Text>
                  <strong>₹ {taxTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Typography.Text strong style={{ fontSize: 15, color: '#0f172a' }}>
                    Grand Total:
                  </Typography.Text>
                  <Typography.Title level={3} style={{ margin: 0, color: '#1d4ed8', fontWeight: 800 }}>
                    ₹ {total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Typography.Title>
                </div>
              </div>

              <Button type="primary" htmlType="submit" size="large" block loading={loading} style={{ height: 44 }}>
                Issue Bill & Deduct Stock
              </Button>
            </Form>
          </Card>
        </aside>
      </div>

      {/* QUICK ADD CUSTOMER MODAL */}
      <Modal
        title="Quick Add Customer"
        open={customerModalOpen}
        onCancel={() => setCustomerModalOpen(false)}
        onOk={() => customerForm.submit()}
        okText="Add and Select"
        confirmLoading={creatingCustomer}
        destroyOnClose
        style={{ maxWidth: 'calc(100vw - 20px)' }}
      >
        <Form form={customerForm} layout="vertical" onFinish={createQuickCustomer} preserve={false}>
          <Form.Item
            name="name"
            label="Customer Name"
            rules={[{ required: true, whitespace: true, message: 'Enter customer name' }]}
          >
            <Input autoFocus maxLength={120} placeholder="Customer or Company Name" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Mobile Number"
            rules={[
              { required: true, message: 'Enter mobile number' },
              { pattern: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit Indian mobile number' },
            ]}
          >
            <Input inputMode="numeric" maxLength={10} placeholder="10-digit mobile number" />
          </Form.Item>
        </Form>
      </Modal>

      {/* BILL CREATED SUCCESS MODAL */}
      <Modal
        title={null}
        open={billSuccessModalOpen}
        footer={null}
        closable={false}
        centered
        width={480}
        style={{ maxWidth: 'calc(100vw - 20px)' }}
      >
        {lastCreatedInvoice && (
          <div style={{ textAlign: 'center', padding: '16px 8px' }}>
            <CheckCircleFilled style={{ fontSize: 52, color: '#16a34a', marginBottom: 12 }} />
            <Typography.Title level={3} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
              Bill Issued Successfully!
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 13.5 }}>
              Disha Machinary · Invoice #{lastCreatedInvoice.number}/{lastCreatedInvoice.year}
            </Typography.Text>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '12px',
                margin: '18px 0',
                display: 'flex',
                justifyContent: 'space-around',
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Invoice No</div>
                <strong style={{ fontSize: 14 }}>#{lastCreatedInvoice.number}/{lastCreatedInvoice.year}</strong>
              </div>
              <div style={{ borderRight: '1px solid #cbd5e1' }} />
              <div>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Net Total</div>
                <strong style={{ fontSize: 15, color: '#1d4ed8' }}>
                  ₹ {Number(lastCreatedInvoice.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
              <Button
                type="primary"
                size="large"
                icon={<BarcodeOutlined />}
                style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
                  height: 44,
                  fontSize: 14,
                }}
                onClick={() => {
                  window.open(
                    `${DOWNLOAD_BASE_URL}invoice/invoice-thermal-${lastCreatedInvoice._id}.pdf`,
                    '_blank'
                  );
                }}
              >
                Print Thermal Slip (80mm)
              </Button>

              <Button
                size="large"
                icon={<FilePdfOutlined />}
                style={{ height: 42, fontSize: 14 }}
                onClick={() => {
                  window.open(
                    `${DOWNLOAD_BASE_URL}invoice/invoice-${lastCreatedInvoice._id}.pdf`,
                    '_blank'
                  );
                }}
              >
                Download / Print A4 Tax Bill
              </Button>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <Button
                  style={{ flex: 1 }}
                  icon={<EyeOutlined />}
                  onClick={() => {
                    setBillSuccessModalOpen(false);
                    navigate(`/invoice/read/${lastCreatedInvoice._id}`);
                  }}
                >
                  View Live Bill
                </Button>
                <Button
                  style={{ flex: 1 }}
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={resetBillingState}
                >
                  New Bill
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
}
