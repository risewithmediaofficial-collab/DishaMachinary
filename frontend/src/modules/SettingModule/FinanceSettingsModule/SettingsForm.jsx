import { Button, Form, Input, InputNumber, Popconfirm, Select, Space, Switch, Typography } from 'antd';
import { CloseOutlined, CheckOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';

const formItems = [
  {
    label: 'Last bill number',
    settingKey: 'last_invoice_number',
    valueType: 'number',
  },
  {
    label: 'Default GST percentage',
    settingKey: 'default_gst_rate',
    valueType: 'percent',
    defaultValue: 18,
  },
  {
    label: 'last_payment_number',
    settingKey: 'last_payment_number',
    valueType: 'number',
  },
];

export default function SettingForm() {
  const translate = useLanguage();
  const form = Form.useFormInstance();

  return (
    <div>
      {formItems.map((item) => {
        return (
          <Form.Item
            key={item.settingKey}
            label={item.label ? translate(item.label) : translate(item.settingKey)}
            name={item.settingKey}
            initialValue={item.defaultValue}
            rules={[
              {
                required: true,
              },
            ]}
            valuePropName={item.valueType === 'boolean' ? 'checked' : 'value'}
          >
            {item.valueType === 'string' && <Input autoComplete="off" />}
            {item.valueType === 'number' && <InputNumber min={0} style={{ width: '100%' }} />}
            {item.valueType === 'percent' && <InputNumber min={0} max={100} precision={2} addonAfter="%" style={{ width: '100%' }} />}
            {item.valueType === 'boolean' && (
              <Switch checkedChildren={<CheckOutlined />} unCheckedChildren={<CloseOutlined />} />
            )}
            {item.valueType === 'array' && (
              <Select
                mode="tags"
                style={{
                  width: '100%',
                }}
                tokenSeparators={[',']}
              />
            )}
          </Form.Item>
        );
      })}
      <Form.Item label="Reset bill number">
        <Space direction="vertical" size={4}>
          <Popconfirm
            title="Reset the bill sequence to 1?"
            description="This can create duplicate bill numbers. Existing bills will not change."
            okText="Reset"
            cancelText="Keep current"
            onConfirm={() => form.setFieldValue('last_invoice_number', 0)}
          >
            <Button danger>Reset bill number</Button>
          </Popconfirm>
          <Typography.Text type="secondary">Press Save after resetting to apply the change.</Typography.Text>
        </Space>
      </Form.Item>
    </div>
  );
}
