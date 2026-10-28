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

        {/* ===== BANK & PAYMENT DETAILS ===== */}
        <Col span={24}>
          <div
            style={{
              marginTop: 8,
              marginBottom: 4,
              fontWeight: 700,
              fontSize: 13,
              color: '#0f172a',
              borderTop: '1px solid #f1f5f9',
              paddingTop: 16,
            }}
          >
            🏦 Bank & Payment Details (shown on invoice / bill)
          </div>
        </Col>

        <Col span={24}>
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>Bank Account Details</span>}
            name="company_bank_account"
            extra="e.g. Bank: HDFC Bank | A/C: 50200012345678 | IFSC: HDFC0001234 | Branch: Industrial Estate"
          >
            <Input.TextArea
              rows={2}
              placeholder="Bank Name | Account Number | IFSC Code | Branch"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>UPI / QR Payment ID</span>}
            name="company_upi"
            extra="e.g. sales@dishamachinary or 9876543210@ybl (shown on bill)"
          >
            <Input
              size="large"
              placeholder="e.g. yourname@upi (GPay / PhonePe / Paytm)"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
}
