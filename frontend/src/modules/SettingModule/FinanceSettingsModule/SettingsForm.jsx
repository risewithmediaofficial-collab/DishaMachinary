import { Button, Form, Input, InputNumber, Popconfirm, Row, Col, Space, Typography } from 'antd';
import { RedoOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';

export default function SettingForm() {
  const translate = useLanguage();
  const form = Form.useFormInstance();

  return (
    <div style={{ width: '100%' }}>
      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12}>
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>Last Invoice / Bill Sequence Number</span>}
            name="last_invoice_number"
            rules={[{ required: true, message: 'Please specify last bill number' }]}
          >
            <InputNumber size="large" min={0} style={{ width: '100%', borderRadius: 8 }} />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>Default GST Tax Rate</span>}
            name="default_gst_rate"
            initialValue={18}
            rules={[{ required: true }]}
          >
            <InputNumber size="large" min={0} max={100} precision={2} addonAfter="%" style={{ width: '100%', borderRadius: 8 }} />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>Last Payment Receipt Number</span>}
            name="last_payment_number"
            rules={[{ required: true }]}
          >
            <InputNumber size="large" min={0} style={{ width: '100%', borderRadius: 8 }} />
          </Form.Item>
        </Col>

        <Col span={24}>
          <div
            style={{
              marginTop: 12,
              padding: '16px 20px',
              borderRadius: 12,
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 700, color: '#9f1239', fontSize: 13.5 }}>Reset Invoice Bill Sequence</div>
              <div style={{ color: '#be123c', fontSize: 12 }}>
                Resets the starting invoice counter back to 1. Existing invoices are preserved.
              </div>
            </div>

            <Popconfirm
              title="Reset the bill sequence to 1?"
              description="This can create duplicate bill numbers if not managed carefully."
              okText="Reset Counter"
              cancelText="Cancel"
              onConfirm={() => form.setFieldValue('last_invoice_number', 0)}
            >
              <Button danger icon={<RedoOutlined />} style={{ borderRadius: 8, fontWeight: 600 }}>
                Reset Bill Counter
              </Button>
            </Popconfirm>
          </div>
        </Col>
      </Row>
    </div>
  );
}
