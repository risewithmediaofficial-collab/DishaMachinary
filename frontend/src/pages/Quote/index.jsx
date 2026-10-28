import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Popconfirm,
  Tooltip,
  message,
  Divider,
} from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SwapOutlined,
  PlusOutlined,
  PrinterOutlined,
  DeleteOutlined,
  EditOutlined,
  ArrowRightOutlined,
  UserOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { request } from '@/request';
import { useMoney } from '@/settings';
import BillViewer from '@/components/BillTemplate';
import SelectAsync from '@/components/SelectAsync';

export default function QuoteDashboard() {
  const [quotes, setQuotes] = useState([]);
  const [summary, setSummary] = useState({
    totalQuotes: 0,
    totalValue: 0,
    pendingQuotes: 0,
    acceptedQuotes: 0,
    convertedQuotes: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [previewQuote, setPreviewQuote] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [productsList, setProductsList] = useState([]);

  const [form] = Form.useForm();
  const { moneyFormatter } = useMoney();
  const navigate = useNavigate();

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.all([
        request.list({ entity: 'quote', options: { items: 50, sort: { created: -1 } } }),
        request.get({ entity: 'quote/summary' }),
      ]);
      if (listRes?.success) {
        setQuotes(listRes.result || []);
      }
      if (summaryRes?.success) {
        setSummary(summaryRes.result || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await request.list({ entity: 'product', options: { items: 100 } });
      if (res?.success) {
        setProductsList(res.result || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchQuotes();
    fetchProducts();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingQuote(null);
    form.resetFields();
    form.setFieldsValue({
      date: dayjs(),
      expiredDate: dayjs().add(30, 'day'),
      gstEnabled: true,
      supplyType: 'intrastate',
      items: [{ quantity: 1, price: 0, gstRate: 18 }],
    });
    setModalVisible(true);
  };

  const handleOpenEditModal = (record) => {
    setEditingQuote(record);
    form.setFieldsValue({
      client: record.client?._id || record.client,
      date: dayjs(record.date),
      expiredDate: dayjs(record.expiredDate),
      gstEnabled: record.gstEnabled,
      supplyType: record.supplyType,
      buyerState: record.buyerState,
      vehicleNo: record.vehicleNo,
      transport: record.transport,
      freight: record.freight,
      discount: record.discount,
      status: record.status,
      notes: record.notes,
      items: record.items?.map((it) => ({
        product: it.product?._id || it.product,
        itemName: it.itemName,
        sku: it.sku,
        hsnCode: it.hsnCode,
        quantity: it.quantity,
        price: it.price,
        gstRate: it.gstRate,
      })),
    });
    setModalVisible(true);
  };

  const handleProductSelect = (productId, fieldIndex) => {
    const prod = productsList.find((p) => p._id === productId);
    if (!prod) return;
    const currentItems = form.getFieldValue('items') || [];
    currentItems[fieldIndex] = {
      ...currentItems[fieldIndex],
      product: prod._id,
      itemName: prod.name,
      sku: prod.sku,
      hsnCode: prod.hsnCode,
      price: prod.sellingPrice || 0,
      gstRate: prod.gstRate !== undefined ? prod.gstRate : 18,
    };
    form.setFieldsValue({ items: currentItems });
  };

  const handleSaveQuote = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        date: values.date.toISOString(),
        expiredDate: values.expiredDate.toISOString(),
      };

      if (editingQuote) {
        const res = await request.update({ entity: 'quote', id: editingQuote._id, jsonData: payload });
        if (res?.success) {
          message.success('Quotation updated successfully');
          setModalVisible(false);
          fetchQuotes();
        }
      } else {
        const res = await request.create({ entity: 'quote', jsonData: payload });
        if (res?.success) {
          message.success('Quotation created successfully');
          setModalVisible(false);
          fetchQuotes();
        }
      }
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.message || 'Error saving quotation');
    }
  };

  const handleConvertQuote = async (quoteId) => {
    try {
      const res = await request.get({ entity: `quote/convert/${quoteId}` });
      if (res?.success) {
        message.success(res.message || 'Quotation converted to Invoice successfully!');
        fetchQuotes();
        if (res.result?.invoice?._id) {
          navigate(`/invoice/read/${res.result.invoice._id}`);
        }
      } else {
        message.error(res?.message || 'Failed to convert quotation');
      }
    } catch (err) {
      message.error(err.message || 'Failed to convert quotation');
    }
  };

  const handleDeleteQuote = async (quoteId) => {
    try {
      const res = await request.delete({ entity: 'quote', id: quoteId });
      if (res?.success) {
        message.success('Quotation deleted successfully');
        fetchQuotes();
      }
    } catch (err) {
      message.error('Failed to delete quotation');
    }
  };

  const statusColorMap = {
    draft: 'default',
    sent: 'processing',
    accepted: 'success',
    converted: 'purple',
    declined: 'error',
    expired: 'warning',
  };

  const columns = [
    {
      title: 'Quote #',
      dataIndex: 'number',
      width: 100,
      render: (number, record) => (
        <span style={{ fontWeight: 700, color: '#0f172a' }}>
          #{number}/{record.year}
        </span>
      ),
    },
    {
      title: 'Client Details',
      dataIndex: 'client',
      render: (client) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>
            {client?.name || 'Walk-in Client'}
          </div>
          {client?.phone && (
            <div style={{ fontSize: 12, color: '#0284c7' }}>📞 {client.phone}</div>
          )}
          {client?.gstin && (
            <div style={{ fontSize: 11, color: '#64748b' }}>GSTIN: {client.gstin}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Products Quoted',
      dataIndex: 'items',
      render: (items) => (
        <div>
          {(items || []).slice(0, 3).map((it, i) => (
            <div key={i} style={{ fontSize: 12, color: '#334155' }}>
              • <strong>{it.quantity}x</strong> {it.itemName} ({moneyFormatter({ amount: it.price })})
            </div>
          ))}
          {(items || []).length > 3 && (
            <div style={{ fontSize: 11, color: '#64748b' }}>
              +{(items || []).length - 3} more items...
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Quoted Date',
      dataIndex: 'date',
      render: (date) => (
        <span style={{ color: '#475569' }}>
          {dayjs(date).format('DD/MM/YYYY')}
        </span>
      ),
    },
    {
      title: 'Quoted Total',
      dataIndex: 'total',
      align: 'right',
      render: (total) => (
        <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>
          {moneyFormatter({ amount: total })}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      align: 'center',
      render: (status) => (
        <Tag color={statusColorMap[status] || 'default'} style={{ textTransform: 'uppercase', fontWeight: 600 }}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
          <Tooltip title="Preview & Print Quotation">
            <Button
              size="small"
              icon={<PrinterOutlined />}
              onClick={() => {
                setPreviewQuote(record);
                setPreviewVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Edit Quote">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenEditModal(record)}
            />
          </Tooltip>
          {!record.isConverted ? (
            <Tooltip title="Convert this Quotation directly into a Tax Invoice / Bill">
              <Button
                size="small"
                type="primary"
                style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
                icon={<SwapOutlined />}
                onClick={() => handleConvertQuote(record._id)}
              >
                Convert to Bill
              </Button>
            </Tooltip>
          ) : (
            <Tag color="purple">Converted</Tag>
          )}
          <Popconfirm
            title="Delete this quotation?"
            onConfirm={() => handleDeleteQuote(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '4px 0 24px 0' }}>
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileTextOutlined style={{ color: '#0284c7' }} /> Quotation & Client Estimates Dashboard
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
            Generate machine quotations for interested clients and convert accepted quotes into tax bills in 1 click.
          </p>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          style={{ borderRadius: 8, height: 42, fontWeight: 600 }}
          onClick={handleOpenCreateModal}
        >
          Create New Quotation
        </Button>
      </div>

      {/* METRIC CARDS */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Total Quotes Issued
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                  {summary.totalQuotes || quotes.length}
                </div>
                <div style={{ fontSize: 12, color: '#0284c7', fontWeight: 600, marginTop: 2 }}>
                  Valued at {moneyFormatter({ amount: summary.totalValue || 0 })}
                </div>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', fontSize: 20 }}>
                <FileTextOutlined />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Pending / In Follow-up
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#d97706', marginTop: 4 }}>
                  {summary.pendingQuotes || quotes.filter((q) => ['draft', 'sent'].includes(q.status)).length}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  Awaiting customer confirmation
                </div>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', fontSize: 20 }}>
                <ClockCircleOutlined />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Accepted Estimates
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a', marginTop: 4 }}>
                  {summary.acceptedQuotes || quotes.filter((q) => q.status === 'accepted').length}
                </div>
                <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, marginTop: 2 }}>
                  Ready to bill & dispatch
                </div>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', fontSize: 20 }}>
                <CheckCircleOutlined />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Converted to Invoices
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#7c3aed', marginTop: 4 }}>
                  {summary.convertedQuotes || quotes.filter((q) => q.isConverted).length}
                </div>
                <div style={{ fontSize: 12, color: '#7c3aed', fontWeight: 600, marginTop: 2 }}>
                  {summary.conversionRate || 0}% Conversion Rate
                </div>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', fontSize: 20 }}>
                <SwapOutlined />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* QUOTATIONS TABLE */}
      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Table
          columns={columns}
          dataSource={quotes}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* CREATE / EDIT QUOTATION MODAL */}
      <Modal
        title={editingQuote ? `Edit Quotation #${editingQuote.number}` : 'Generate Client Machine Quotation'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSaveQuote}
        width={850}
        okText={editingQuote ? 'Update Quotation' : 'Create Quotation'}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ gstEnabled: true, supplyType: 'intrastate', status: 'draft' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<span style={{ fontWeight: 600 }}>Select Client / Customer</span>}
                name="client"
                rules={[{ required: true, message: 'Please select a client' }]}
              >
                <SelectAsync
                  entity="client"
                  displayLabels={['name', 'phone']}
                  outputValue="_id"
                  placeholder="Select client"
                  withRedirect={true}
                  urlToRedirect="/customer"
                  redirectLabel="+ Add New Customer"
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Quote Date" name="date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Valid Until" name="expiredDate" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="Quotation Status" name="status">
                <Select
                  options={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'sent', label: 'Sent to Customer' },
                    { value: 'accepted', label: 'Accepted' },
                    { value: 'declined', label: 'Declined' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Tax Mode" name="gstEnabled">
                <Select
                  options={[
                    { value: true, label: 'GST Tax Quotation (18%)' },
                    { value: false, label: 'Retail / Non-GST Estimate' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Vehicle No (Optional)" name="vehicleNo">
                <Input placeholder="e.g. TN-23-AB-1234" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Transport / Carrier" name="transport">
                <Input placeholder="e.g. VRL Logistics, Self" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" style={{ margin: '12px 0', fontSize: 13, fontWeight: 700 }}>
            Quoted Products & Machinery
          </Divider>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, idx) => (
                  <Row gutter={12} key={key} align="middle" style={{ marginBottom: 8, background: '#f8fafc', padding: '8px 10px', borderRadius: 8 }}>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'product']}
                        label={idx === 0 ? 'Machine / Product' : ''}
                        rules={[{ required: true, message: 'Select product' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Select
                          showSearch
                          placeholder="Select machine from inventory"
                          optionFilterProp="children"
                          onChange={(val) => handleProductSelect(val, name)}
                          options={productsList.map((p) => ({
                            value: p._id,
                            label: `${p.name} (₹${p.sellingPrice || 0})`,
                          }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item
                        {...restField}
                        name={[name, 'quantity']}
                        label={idx === 0 ? 'Qty' : ''}
                        rules={[{ required: true }]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber min={1} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item
                        {...restField}
                        name={[name, 'price']}
                        label={idx === 0 ? 'Rate (₹)' : ''}
                        rules={[{ required: true }]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item
                        {...restField}
                        name={[name, 'gstRate']}
                        label={idx === 0 ? 'GST %' : ''}
                        style={{ marginBottom: 0 }}
                      >
                        <Select
                          options={[
                            { value: 0, label: '0%' },
                            { value: 5, label: '5%' },
                            { value: 12, label: '12%' },
                            { value: 18, label: '18%' },
                            { value: 28, label: '28%' },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={3} style={{ textAlign: 'center', paddingTop: idx === 0 ? 24 : 0 }}>
                      {fields.length > 1 && (
                        <Button danger type="text" icon={<DeleteOutlined />} onClick={() => remove(name)} />
                      )}
                    </Col>
                  </Row>
                ))}
                <Button type="dashed" onClick={() => add({ quantity: 1, price: 0, gstRate: 18 })} block icon={<PlusOutlined />} style={{ marginTop: 8 }}>
                  + Add Another Product / Spare
                </Button>
              </>
            )}
          </Form.List>

          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={8}>
              <Form.Item label="Freight / Transport Charges (₹)" name="freight">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Quote Discount (₹)" name="discount">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Notes / Commercial Terms" name="notes">
                <Input.TextArea rows={1} placeholder="Validity, payment terms, delivery..." />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* PREVIEW MODAL */}
      <Modal
        title={`Quotation #${previewQuote?.number}/${previewQuote?.year || ''}`}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={900}
        destroyOnClose
      >
        {previewQuote && (
          <BillViewer invoice={previewQuote} entity="quote" showToolbar={true} defaultFormat="a4" />
        )}
      </Modal>
    </div>
  );
}
