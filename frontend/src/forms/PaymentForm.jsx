import React from 'react';
import dayjs from 'dayjs';
import { Form, Input, InputNumber, Select } from 'antd';
import { DatePicker } from 'antd';
import { useMoney, useDate } from '@/settings';

import useLanguage from '@/locale/useLanguage';

export default function PaymentForm({ maxAmount = null, isUpdateForm = false }) {
  const translate = useLanguage();
  const { TextArea } = Input;
  const money = useMoney();
  const { dateFormat } = useDate();
  return (
    <>
      <Form.Item
        label={translate('number')}
        name="number"
        initialValue={1}
        rules={[
          {
            required: true,
          },
        ]}
        style={{ width: '50%', float: 'left', paddingRight: '20px' }}
      >
        <InputNumber min={1} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item
        name="date"
        label={translate('date')}
        rules={[
          {
            required: true,
            type: 'object',
          },
        ]}
        initialValue={dayjs()}
        style={{ width: '100%' }}
      >
        <DatePicker format={dateFormat} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item label={translate('amount')} name="amount" rules={[{ required: true }]}>
        <InputNumber
          className="moneyInput"
          min={0}
          controls={false}
          max={maxAmount}
          placeholder="0.00"
          addonAfter={money.currency_position === 'after' ? money.currency_symbol : undefined}
          addonBefore={money.currency_position === 'before' ? money.currency_symbol : undefined}
        />
      </Form.Item>
      <Form.Item
        label={translate('payment Mode')}
        name="method"
        initialValue="cash"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Select options={[
          { value: 'cash', label: 'Cash' },
          { value: 'upi', label: 'UPI' },
          { value: 'bank_transfer', label: 'Bank transfer' },
          { value: 'card', label: 'Card' },
          { value: 'credit', label: 'Credit adjustment' },
        ]} />
      </Form.Item>
      <Form.Item label="Payment Account" name="account">
        <Input placeholder="Cash counter or bank account" />
      </Form.Item>
      <Form.Item label={translate('Reference')} name="ref">
        <Input />
      </Form.Item>
      <Form.Item label={translate('Description')} name="description">
        <TextArea />
      </Form.Item>
    </>
  );
}
