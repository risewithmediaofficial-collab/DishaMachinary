import { useDispatch, useSelector } from 'react-redux';
import { Input, Form, Select, Switch } from 'antd';
import { CloseOutlined, CheckOutlined } from '@ant-design/icons';

import useLanguage from '@/locale/useLanguage';

export default function GeneralSettingForm() {
  const translate = useLanguage();
  const dispatch = useDispatch();

  return (
    <div>
      <Form.Item
        label={<span style={{ fontWeight: 600, color: '#334155' }}>{translate('Date Format') || 'Application Date Format'}</span>}
        name="idurar_app_date_format"
        rules={[
          {
            required: true,
            message: 'Date format is required',
          },
        ]}
      >
        <Select
          showSearch
          size="large"
          placeholder="Select default date format..."
          style={{
            width: '100%',
            borderRadius: 8,
          }}
          options={[
            { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (e.g. 16/10/2026 - Standard Indian/UK)' },
            { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (e.g. 10/16/2026 - US Format)' },
            { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (e.g. 16-10-2026)' },
            { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (e.g. 2026-10-16 - ISO Format)' },
            { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY (e.g. 16.10.2026)' },
            { value: 'DD MMM YYYY', label: 'DD MMM YYYY (e.g. 16 Oct 2026)' },
            { value: 'MMM DD, YYYY', label: 'MMM DD, YYYY (e.g. Oct 16, 2026)' },
          ]}
        />
      </Form.Item>
      <Form.Item
        label={<span style={{ fontWeight: 600, color: '#334155' }}>{translate('email') || 'Company System Email'}</span>}
        name="idurar_app_company_email"
        rules={[
          {
            required: true,
            type: 'email',
            message: 'Valid company email is required',
          },
        ]}
      >
        <Input size="large" placeholder="e.g. contact@dishamachinary.com" style={{ borderRadius: 8 }} />
      </Form.Item>
    </div>
  );
}
