import { Form, Select, Input, Switch, InputNumber, Row, Col } from 'antd';
import { useEffect } from 'react';
import useLanguage from '@/locale/useLanguage';
import { currencyOptions } from '@/utils/currencyList';

export default function SettingsForm() {
  const translate = useLanguage();
  const form = Form.useFormInstance();
  const currencyCode = Form.useWatch('default_currency_code', form);

  useEffect(() => {
    if (currencyCode !== 'INR' || form.getFieldValue('currency_symbol') !== '₹') {
      form.setFieldsValue({ default_currency_code: 'INR', currency_symbol: '₹' });
    }
  }, [currencyCode, form]);

  return (
    <div style={{ width: '100%' }}>
      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12}>
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>Default Currency</span>}
            name="default_currency_code"
            rules={[{ required: true, message: 'Please select currency' }]}
          >
            <Select
              size="large"
              showSearch
              placeholder="Select currency..."
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              filterSort={(optionA, optionB) =>
                (optionA?.label ?? '').toLowerCase().startsWith((optionB?.label ?? '').toLowerCase())
              }
              options={currencyOptions()}
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>Currency Symbol</span>}
            name="currency_symbol"
            rules={[{ required: true, message: 'Currency symbol is required' }]}
          >
            <Input size="large" placeholder="e.g. ₹" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>Symbol Position</span>}
            name="currency_position"
            rules={[{ required: true }]}
          >
            <Select size="large" style={{ borderRadius: 8 }}>
              <Select.Option value="before">Before Amount (e.g. ₹ 1,000)</Select.Option>
              <Select.Option value="after">After Amount (e.g. 1,000 ₹)</Select.Option>
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>Decimal Precision</span>}
            name="cent_precision"
            rules={[{ required: true }]}
          >
            <InputNumber size="large" min={0} max={4} style={{ width: '100%', borderRadius: 8 }} />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>Decimal Separator</span>}
            name="decimal_sep"
            rules={[{ required: true }]}
          >
            <Input size="large" placeholder="." style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>Thousand Separator</span>}
            name="thousand_sep"
            rules={[{ required: true }]}
          >
            <Input size="large" placeholder="," style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>Format Zero Amount (Display '0.00' instead of empty)</span>}
            name="zero_format"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
}
