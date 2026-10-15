import { Form, Input, InputNumber, Row, Col, Button } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import SelectAsync from '@/components/SelectAsync';
import MoneyInputFormItem from '@/components/MoneyInputFormItem';
import { request } from '@/request';
import { useMoney } from '@/settings';

export default function InvoiceItemRow({ field, remove, defaultGstRate = 18 }) {
  const form = Form.useFormInstance();
  const money = useMoney();
  const productId = Form.useWatch(['items', field.name, 'product'], form);
  const price = Form.useWatch(['items', field.name, 'price'], form) || 0;
  const quantity = Form.useWatch(['items', field.name, 'quantity'], form) || 0;
  const productOptions = { entity: 'product', displayLabels: ['name', 'sku'] };

  const handleProductChange = async (id) => {
    if (!id) return;
    const response = await request.read({ entity: 'product', id });
    if (!response?.success) return;

    const product = response.result;
    const base = ['items', field.name];
    form.setFields([
      { name: [...base, 'itemName'], value: product.name },
      { name: [...base, 'description'], value: product.description || '' },
      { name: [...base, 'price'], value: product.sellingPrice },
      { name: [...base, 'gstRate'], value: product.gstRate || 0 },
      { name: [...base, 'hsnCode'], value: product.hsnCode || '' },
      { name: [...base, 'sku'], value: product.sku },
      { name: [...base, 'quantity'], value: form.getFieldValue([...base, 'quantity']) || 1 },
    ]);
  };

  return (
    <div className="invoice-item-card" style={{ position: 'relative', marginBottom: 10 }}>
      <Row gutter={[8, 8]} align="middle">
        <Col xs={24} sm={12} md={5}>
          <Form.Item name={[field.name, 'product']} label={<span className="mobile-item-label">Product</span>}>
            <SelectAsync {...productOptions} placeholder="Product (optional)" onChange={handleProductChange} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Form.Item name={[field.name, 'itemName']} label={<span className="mobile-item-label">Item</span>} rules={[{ required: true, message: 'Enter an item name' }]}>
            <Input placeholder="Item or service" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Form.Item name={[field.name, 'description']} label={<span className="mobile-item-label">Description</span>}>
            <Input placeholder="Description" />
          </Form.Item>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Form.Item name={[field.name, 'quantity']} label={<span className="mobile-item-label">Qty</span>} rules={[{ required: true, type: 'number', min: 0.01 }]}>
            <InputNumber min={0.01} style={{ width: '100%' }} placeholder="Qty" />
          </Form.Item>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Form.Item name={[field.name, 'price']} label={<span className="mobile-item-label">Price</span>} rules={[{ required: !productId, type: 'number', min: 0 }]}>
            <InputNumber
              min={0}
              disabled={Boolean(productId)}
              controls={false}
              style={{ width: '100%' }}
              placeholder="Price"
              addonAfter={money.currency_position === 'after' ? money.currency_symbol : undefined}
              addonBefore={money.currency_position === 'before' ? money.currency_symbol : undefined}
            />
          </Form.Item>
        </Col>
        <Col xs={12} sm={6} md={2}>
          <Form.Item name={[field.name, 'gstRate']} label={<span className="mobile-item-label">GST %</span>}>
            <InputNumber min={0} max={100} disabled={Boolean(productId)} style={{ width: '100%' }} placeholder="GST" addonAfter="%" />
          </Form.Item>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ flex: 1 }}>
              <MoneyInputFormItem readOnly value={Number((price * quantity).toFixed(2))} />
            </div>
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => remove(field.name)}
              title="Remove item"
            />
          </div>
        </Col>
      </Row>
    </div>
  );
}