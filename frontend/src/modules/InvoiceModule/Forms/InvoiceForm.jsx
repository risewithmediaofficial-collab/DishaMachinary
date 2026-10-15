import { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { Form, Input, InputNumber, Button, Select, Divider, Row, Col, Switch } from 'antd';

import { PlusOutlined } from '@ant-design/icons';

import { DatePicker } from 'antd';

import AutoCompleteAsync from '@/components/AutoCompleteAsync';

import InvoiceItemRow from './InvoiceItemRow';

import MoneyInputFormItem from '@/components/MoneyInputFormItem';
import { selectFinanceSettings } from '@/redux/settings/selectors';
import { useDate } from '@/settings';
import useLanguage from '@/locale/useLanguage';

import { useSelector } from 'react-redux';

export default function InvoiceForm({ subTotal = 0, current = null }) {
  const { last_invoice_number } = useSelector(selectFinanceSettings);

  if (last_invoice_number === undefined) {
    return <></>;
  }

  return <LoadInvoiceForm subTotal={subTotal} current={current} />;
}

function LoadInvoiceForm({ subTotal = 0, current = null }) {
  const translate = useLanguage();
  const { dateFormat } = useDate();
  const form = Form.useFormInstance();
  const { last_invoice_number, default_gst_rate = 18 } = useSelector(selectFinanceSettings);
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [lastNumber, setLastNumber] = useState(() => last_invoice_number + 1);
  const gstEnabled = Form.useWatch('gstEnabled', form) ?? current?.gstEnabled ?? true;
  const invoiceItems = Form.useWatch('items', form) || [];
  const discount = Number(Form.useWatch('discount', form) || 0);
  const calculatedSubTotal = invoiceItems.reduce(
    (sum, item) => sum + Number(item?.quantity || 0) * Number(item?.price || 0),
    0
  );
  const rawTaxTotal = gstEnabled
    ? invoiceItems.reduce(
        (sum, item) =>
          sum +
          (Number(item?.quantity || 0) * Number(item?.price || 0) * Number(item?.gstRate || 0)) / 100,
        0
      )
    : 0;
  const displaySubTotal = invoiceItems.length ? Number(calculatedSubTotal.toFixed(2)) : subTotal;
  const safeDiscount = Math.min(Math.max(discount, 0), displaySubTotal);
  const taxTotal = Number((rawTaxTotal * (displaySubTotal ? (displaySubTotal - safeDiscount) / displaySubTotal : 0)).toFixed(2));
  const total = Number((displaySubTotal - safeDiscount + taxTotal).toFixed(2));

  useEffect(() => {
    if (current) {
      const { year, number } = current;
      setCurrentYear(year);
      setLastNumber(number);
    }
  }, [current]);

  const addField = useRef(false);

  useEffect(() => {
    addField.current.click();
  }, []);

  return (
    <>
      <Row gutter={[12, 0]}>
        <Col className="gutter-row" xs={24} sm={12} md={8}>
          <Form.Item
            name="client"
            label={translate('Client')}
            rules={[
              {
                required: true,
              },
            ]}
          >
            <AutoCompleteAsync
              entity={'client'}
              displayLabels={['name']}
              searchFields={'name'}
              redirectLabel={'Add New Client'}
              withRedirect
              urlToRedirect={'/customer'}
            />
          </Form.Item>
        </Col>
        <Col className="gutter-row" xs={12} sm={6} md={3}>
          <Form.Item
            label={translate('number')}
            name="number"
            initialValue={lastNumber}
            rules={[
              {
                required: true,
              },
            ]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col className="gutter-row" xs={12} sm={6} md={3}>
          <Form.Item
            label={translate('year')}
            name="year"
            initialValue={currentYear}
            rules={[
              {
                required: true,
              },
            ]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        </Col>

        <Col className="gutter-row" xs={12} sm={6} md={4}>
          <Form.Item
            label={translate('status')}
            name="status"
            rules={[
              {
                required: false,
              },
            ]}
            initialValue={'posted'}
          >
            <Select
              options={[
                { value: 'posted', label: 'Posted (Active)' },
                { value: 'draft', label: translate('Draft') },
                { value: 'pending', label: translate('Pending') },
              ]}
            ></Select>
          </Form.Item>
        </Col>

        <Col className="gutter-row" xs={12} sm={6} md={6}>
          <Form.Item
            label="Payment Mode"
            name="paymentMethod"
            initialValue="cash"
          >
            <Select
              options={[
                { value: 'cash', label: '💵 Cash' },
                { value: 'upi', label: '📱 UPI' },
                { value: 'card', label: '💳 Card' },
                { value: 'bank_transfer', label: '🏦 Bank Transfer' },
              ]}
            />
          </Form.Item>
        </Col>

        <Col className="gutter-row" xs={12} sm={12} md={8}>
          <Form.Item
            name="date"
            label={translate('Date')}
            rules={[
              {
                required: true,
                type: 'object',
              },
            ]}
            initialValue={dayjs()}
          >
            <DatePicker style={{ width: '100%' }} format={dateFormat} />
          </Form.Item>
        </Col>
        <Col className="gutter-row" xs={12} sm={12} md={6}>
          <Form.Item
            name="expiredDate"
            label={translate('Expire Date')}
            rules={[
              {
                required: true,
                type: 'object',
              },
            ]}
            initialValue={dayjs().add(30, 'days')}
          >
            <DatePicker style={{ width: '100%' }} format={dateFormat} />
          </Form.Item>
        </Col>
        <Col className="gutter-row" xs={24} sm={24} md={10}>
          <Form.Item label={translate('Note')} name="notes">
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Divider dashed />
      <Row gutter={[12, 12]} className="desktop-table-header" style={{ position: 'relative', marginBottom: 8, fontWeight: 600, color: '#475569' }}>
        <Col span={5}>Product</Col>
        <Col span={4}>Item</Col>
        <Col span={4}>Description</Col>
        <Col span={3}>{translate('Quantity')}</Col>
        <Col span={3}>{translate('Price')}</Col>
        <Col span={2}>GST</Col>
        <Col span={3}>{translate('Total')}</Col>
      </Row>
      <Form.List name="items">
        {(fields, { add, remove }) => (
          <>
            {fields.map((field) => (
              <InvoiceItemRow key={field.key} remove={remove} field={field} defaultGstRate={default_gst_rate} />
            ))}
            <Form.Item>
              <Button
                type="dashed"
                onClick={() => add({ quantity: 1, gstRate: default_gst_rate })}
                block
                icon={<PlusOutlined />}
                ref={addField}
              >
                {translate('Add field')}
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>
      <Divider dashed />
      <div className="invoice-form-footer">
        <div className="invoice-summary">
          <Form.Item name="discount" label="Bill Discount" initialValue={current?.discount || undefined}>
            <InputNumber min={0} max={displaySubTotal} precision={2} placeholder="0.00" style={{ width: '100%' }} />
          </Form.Item>
          <div className="invoice-summary-line">
            <span>{translate('Sub Total')}</span>
            <MoneyInputFormItem readOnly value={displaySubTotal} />
          </div>
          <div className="invoice-summary-line">
            <Form.Item name="gstEnabled" valuePropName="checked" initialValue={current?.gstEnabled ?? true}>
              <Switch checkedChildren="GST On" unCheckedChildren="No GST" />
            </Form.Item>
            <MoneyInputFormItem readOnly value={taxTotal} />
          </div>
          <div className="invoice-summary-line invoice-summary-total">
            <strong>{translate('Total')}</strong>
            <MoneyInputFormItem readOnly value={total} />
          </div>
        </div>
      </div>
    </>
  );
}
