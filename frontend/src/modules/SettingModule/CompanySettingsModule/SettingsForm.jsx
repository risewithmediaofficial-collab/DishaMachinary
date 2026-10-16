import { Form, Input, InputNumber, Row, Col } from 'antd';
import useLanguage from '@/locale/useLanguage';

export default function SettingForm() {
  const translate = useLanguage();

  return (
    <div style={{ width: '100%' }}>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>Company / Business Legal Name</span>}
            name="company_name"
          >
            <Input size="large" placeholder="e.g. Disha Machinary" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>Registered Business Address</span>}
            name="company_address"
          >
            <Input.TextArea rows={2} placeholder="Full factory / warehouse street address..." style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>State / Province</span>}
            name="company_state"
          >
            <Input size="large" placeholder="e.g. Tamil Nadu" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>Country</span>}
            name="company_country"
          >
            <Input size="large" placeholder="e.g. India" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>Official Business Email</span>}
            name="company_email"
          >
            <Input size="large" placeholder="e.g. sales@dishamachinary.com" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>Phone / Contact Number</span>}
            name="company_phone"
          >
            <Input size="large" placeholder="e.g. +91 98765 43210" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>Website URL</span>}
            name="company_website"
          >
            <Input size="large" placeholder="e.g. https://dishamachinary.com" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>GSTIN (GST Identification Number)</span>}
            name="company_gstin"
          >
            <Input size="large" placeholder="e.g. 33AAAAA0000A1Z5" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>PAN / Tax ID</span>}
            name="company_tax_number"
          >
            <Input size="large" placeholder="e.g. ABCDE1234F" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>VAT Number (If applicable)</span>}
            name="company_vat_number"
          >
            <Input size="large" placeholder="Optional VAT number" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>Company Registration Number (CIN)</span>}
            name="company_reg_number"
          >
            <Input size="large" placeholder="Optional CIN / Reg No" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
}
