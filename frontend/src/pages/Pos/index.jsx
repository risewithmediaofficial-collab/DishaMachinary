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
import { selectFinanceSettings, selectCompanySettings } from '@/redux/settings/selectors';
import { useSelector } from 'react-redux';
import { printInvoice } from '@/utils/printBill';

export default function Pos() {
  const navigate = useNavigate();
  const { currency_code } = useMoney();
  const { last_invoice_number } = useSelector(selectFinanceSettings);
  const companySettings = useSelector(selectCompanySettings) || {};
  const [form] = Form.useForm();
  const [customerForm] = Form.useForm();
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [cart, setCart] = useState([]);
  const [gstEnabled, setGstEnabled] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [billSuccessModalOpen, setBillSuccessModalOpen] = useState(false);
  const [lastCreatedInvoice, setLastCreatedInvoice] = useState(null);
  const loadProducts = () => {
    request.list({ entity: 'product', options: { page: 1, items: 200 } }).then((response) => {
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

  const safeDiscount = useMemo(() => {
    if (!subTotal || subTotal <= 0) return 0;
    const val = Number(discountValue) || 0;
    if (val <= 0) return 0;
    if (discountType === 'percent') {
      const pct = Math.min(Math.max(val, 0), 100);
      return Number(((subTotal * pct) / 100).toFixed(2));
    } else {
      return Number(Math.min(Math.max(val, 0), subTotal).toFixed(2));
    }
  }, [subTotal, discountType, discountValue]);

  const discountPercentDisplay = useMemo(() => {
    if (!subTotal || subTotal <= 0 || safeDiscount <= 0) return 0;
    if (discountType === 'percent') return Number(discountValue) || 0;
    return Number(((safeDiscount / subTotal) * 100).toFixed(1));
  }, [subTotal, safeDiscount, discountType, discountValue]);

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
  const taxTotal = Number((rawTaxTotal * (subTotal ? (subTotal - safeDiscount) / subTotal : 0)).toFixed(2));
  const total = Math.max(0, Number((subTotal - safeDiscount + taxTotal).toFixed(2)));

  const paidNowWatch = Form.useWatch('paidNow', form);
  const hasEnteredPaidNow = paidNowWatch !== undefined && paidNowWatch !== null && paidNowWatch !== '';
  const actualPaid = hasEnteredPaidNow ? Number(paidNowWatch) : total;
  const balanceDue = Math.max(0, Number((total - actualPaid).toFixed(2)));
  const changeReturn = Math.max(0, Number((actualPaid - total).toFixed(2)));

  const productOptions = useMemo(() => {
    return products.map((product) => {
      const available = Number(product.stockQuantity || 0) - Number(product.reservedQuantity || 0);
      const labelParts = [
        product.name,
        product.sku ? `SKU: ${product.sku}` : null,
        product.modelNumber ? `Model: ${product.modelNumber}` : null,
        `₹${Number(product.sellingPrice || 0).toLocaleString('en-IN')}`,
        `(${available} in stock)`,
      ].filter(Boolean);

      return {
        value: product._id,
        label: labelParts.join(' · '),
        searchTerms: [product.name, product.sku, product.modelNumber, product.barcode]
          .filter(Boolean)
          .join(' ')
          .toLowerCase(),
      };
    });
  }, [products]);

  const addProduct = (value) => {
    const product = products.find(
      (item) => item._id === value || item.sku === value || item.barcode === value
    );
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

  const handleSearchChange = (val) => {
    // If val is the ID of an existing product (i.e. selected from the dropdown), reset to empty
    if (products.some((p) => p._id === val)) {
      setProductSearch('');
      return;
    }
    // When typing in the search box, store and show the typed search query
    setProductSearch(val || '');
  };

  const handleSelectProduct = (productId) => {
    addProduct(productId);
    setProductSearch('');
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      const q = (productSearch || '').trim().toLowerCase();
      if (!q) return;

      const exactMatch = products.find(
        (p) =>
          (p.sku && p.sku.toLowerCase() === q) ||
          (p.barcode && p.barcode.toLowerCase() === q)
      );
      if (exactMatch) {
        e.preventDefault();
        addProduct(exactMatch._id);
        setProductSearch('');
      }
    }
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
      jsonData: {
        name: values.name.trim(),
        phone: values.phone.trim(),
        country: 'India',
        state: companySettings.company_state || 'Tamil Nadu',
      },
    });
    setCreatingCustomer(false);
    if (!response?.success) return;
    setSelectedCustomer(response.result);
    form.setFieldsValue({ client: response.result._id });
    customerForm.resetFields();
    setCustomerModalOpen(false);
    message.success(`${response.result.name} selected for this bill.`);
  };

  const resetBillingState = () => {
    setCart([]);
    setSelectedCustomer(null);
    form.resetFields();
    setDiscountValue(0);
    setDiscountType('percent');
    setLastCreatedInvoice(null);
    setBillSuccessModalOpen(false);
  };

  const checkout = async (values) => {
    if (!cart.length) return message.error('Add at least one product to the bill.');
    setLoading(true);
    setError('');

    const paid =
      values.paidNow !== undefined && values.paidNow !== null && values.paidNow !== ''
        ? Math.max(0, Number(values.paidNow))
        : total;

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
        discount: safeDiscount,
        gstEnabled,
        paidNow: paid,
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
    const invoiceToPrint = {
      ...invoice,
      client:
        invoice.client && typeof invoice.client === 'object' && invoice.client?.name
          ? invoice.client
          : selectedCustomer || { name: 'Walk-in Customer' },
      credit: paid,
      paidNow: paid,
    };
    setLoading(false);
    if (paid >= total) {
      message.success(`Bill #${invoice.number}/${invoice.year} created and marked as FULLY PAID.`);
    } else if (paid === 0) {
      message.success(`Bill #${invoice.number}/${invoice.year} saved as PENDING BILL (₹${total.toLocaleString('en-IN')} Due).`);
    } else {
      message.success(`Bill #${invoice.number}/${invoice.year} recorded (₹${paid.toLocaleString('en-IN')} Paid · ₹${(total - paid).toLocaleString('en-IN')} Due).`);
    }
    setLastCreatedInvoice(invoiceToPrint);
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
              value={productSearch}
              onChange={handleSearchChange}
              onSelect={handleSelectProduct}
              onKeyDown={handleSearchKeyDown}
              options={productOptions}
              filterOption={(input, option) => {
                if (!input) return true;
                const terms = input.trim().toLowerCase().split(/\s+/).filter(Boolean);
                if (!terms.length) return true;
                const searchable = `${option?.searchTerms || ''} ${
                  typeof option?.label === 'string' ? option.label.toLowerCase() : ''
                }`;
                return terms.every((term) => searchable.includes(term));
              }}
              defaultActiveFirstOption
              allowClear
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

              {/* BILL DISCOUNT (% OR ₹) */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '10px 12px',
                  marginBottom: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Bill Discount</span>
                  <Radio.Group
                    size="small"
                    value={discountType}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setDiscountType(newType);
                      if (discountValue > 0 && subTotal > 0) {
                        if (newType === 'amount') {
                          setDiscountValue(Number(((subTotal * discountValue) / 100).toFixed(2)));
                        } else {
                          setDiscountValue(Number(((discountValue / subTotal) * 100).toFixed(1)));
                        }
                      }
                    }}
                    optionType="button"
                    buttonStyle="solid"
                  >
                    <Radio.Button value="percent">% Percent</Radio.Button>
                    <Radio.Button value="amount">₹ Amount</Radio.Button>
                  </Radio.Group>
                </div>

                <InputNumber
                  min={0}
                  max={discountType === 'percent' ? 100 : subTotal}
                  precision={2}
                  value={discountValue}
                  onChange={(val) => setDiscountValue(val || 0)}
                  placeholder={discountType === 'percent' ? 'Discount % (e.g. 5)' : 'Discount ₹ (e.g. 500)'}
                  prefix={discountType === 'percent' ? '%' : '₹'}
                  style={{ width: '100%' }}
                />

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 6,
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  <span style={{ color: '#64748b' }}>
                    {discountType === 'percent' ? 'Subtracted Less Amount:' : 'Effective Discount:'}
                  </span>
                  <span style={{ color: safeDiscount > 0 ? '#b91c1c' : '#64748b', fontWeight: 700 }}>
                    {discountType === 'percent'
                      ? `- ₹ ${safeDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                      : `${discountPercentDisplay}% off (- ₹ ${safeDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })})`}
                  </span>
                </div>
              </div>

              {/* PAID NOW & QUICK ACTIONS */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '10px 12px',
                  marginBottom: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Amount Paid (₹)</span>
                  <Space size={4}>
                    <Button
                      size="small"
                      type={hasEnteredPaidNow && Number(paidNowWatch) === total ? 'primary' : 'default'}
                      onClick={() => form.setFieldValue('paidNow', total)}
                      style={{ fontSize: 11, height: 24, padding: '0 8px', borderRadius: 4 }}
                    >
                      Full Paid (₹{total.toLocaleString('en-IN')})
                    </Button>
                    <Button
                      size="small"
                      danger={hasEnteredPaidNow && Number(paidNowWatch) === 0}
                      onClick={() => form.setFieldValue('paidNow', 0)}
                      style={{ fontSize: 11, height: 24, padding: '0 8px', borderRadius: 4 }}
                    >
                      Credit / Pending (₹0)
                    </Button>
                  </Space>
                </div>

                <Form.Item name="paidNow" noStyle>
                  <InputNumber
                    min={0}
                    precision={2}
                    placeholder={`₹ ${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (Default: Full Paid)`}
                    style={{ width: '100%' }}
                    prefix="₹"
                  />
                </Form.Item>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 5 }}>
                  Leave blank or click "Full Paid" for immediate settlement; enter 0 for pending credit bill.
                </div>
              </div>

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
                {safeDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: '#b91c1c' }}>
                    <span>Discount ({discountPercentDisplay}%):</span>
                    <strong>- ₹ {safeDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
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

                <Divider style={{ margin: '10px 0', borderStyle: 'dashed' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <Typography.Text type="secondary">Amount Paid:</Typography.Text>
                  <strong style={{ color: '#0f172a' }}>
                    ₹ {actualPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </strong>
                </div>

                {balanceDue > 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: 8,
                      marginTop: 6,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#991b1b', fontSize: 13 }}>Balance Amount (Due):</div>
                      <Tag color="red" style={{ fontSize: 11, margin: 0, fontWeight: 700 }}>
                        PENDING BILL
                      </Tag>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#dc2626' }}>
                      ₹ {balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ) : changeReturn > 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: 8,
                      marginTop: 6,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e40af', fontSize: 13 }}>Change to Return:</div>
                      <Tag color="blue" style={{ fontSize: 11, margin: 0 }}>
                        Cash Change
                      </Tag>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#2563eb' }}>
                      ₹ {changeReturn.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: 8,
                      marginTop: 6,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#166534', fontSize: 13 }}>Payment Status:</div>
                      <Tag color="green" style={{ fontSize: 11, margin: 0, fontWeight: 700 }}>
                        PAID IN FULL
                      </Tag>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#16a34a' }}>
                      ₹ 0.00 Due
                    </div>
                  </div>
                )}
              </div>

              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
                style={{
                  height: 46,
                  fontWeight: 700,
                  fontSize: 15,
                  backgroundColor: balanceDue > 0 && actualPaid === 0 ? '#d97706' : '#2563eb',
                  borderColor: balanceDue > 0 && actualPaid === 0 ? '#b45309' : '#1d4ed8',
                }}
              >
                {balanceDue > 0 && actualPaid === 0
                  ? `Issue Pending Bill (₹${total.toLocaleString('en-IN')} Due)`
                  : balanceDue > 0
                  ? `Issue Bill (₹${actualPaid.toLocaleString('en-IN')} Paid · ₹${balanceDue.toLocaleString('en-IN')} Due)`
                  : `Issue Bill & Record Full Payment (₹${total.toLocaleString('en-IN')})`}
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
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
                textAlign: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Invoice No</div>
                <strong style={{ fontSize: 13 }}>#{lastCreatedInvoice.number}/{lastCreatedInvoice.year}</strong>
              </div>
              <div style={{ borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Net Total</div>
                <strong style={{ fontSize: 14, color: '#1d4ed8' }}>
                  ₹ {Number(lastCreatedInvoice.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </strong>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>
                  {Math.max(0, (lastCreatedInvoice.total || 0) - (lastCreatedInvoice.credit || 0)) > 0
                    ? 'Balance Due'
                    : 'Payment Status'}
                </div>
                {Math.max(0, (lastCreatedInvoice.total || 0) - (lastCreatedInvoice.credit || 0)) > 0 ? (
                  <strong style={{ fontSize: 14, color: '#dc2626' }}>
                    ₹ {Math.max(0, (lastCreatedInvoice.total || 0) - (lastCreatedInvoice.credit || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </strong>
                ) : (
                  <Tag color="green" style={{ margin: 0, fontWeight: 700 }}>
                    PAID
                  </Tag>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
              <Button
                type="primary"
                size="large"
                icon={<PrinterOutlined />}
                style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
                  height: 48,
                  fontSize: 15,
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)',
                }}
                onClick={() => {
                  printInvoice(lastCreatedInvoice, 'thermal', companySettings);
                }}
              >
                Print Thermal Slip (80mm)
              </Button>

              <Button
                size="large"
                icon={<PrinterOutlined />}
                style={{ height: 44, fontSize: 14.5, fontWeight: 600, borderColor: '#cbd5e1' }}
                onClick={() => {
                  printInvoice(lastCreatedInvoice, 'a4', companySettings);
                }}
              >
                Print A4 Tax Invoice
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
