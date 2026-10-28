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
            <Input size="large" placeholder="e.g. DISHA MACHINERY" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>Company Tagline / Subtitle (Shown on Invoices)</span>}
            name="company_tagline"
          >
            <Input size="large" placeholder="e.g. [ All Kinds of Machinery, All Kinds of Welding & Wiring Equipment and foods ]" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>Registered Business Address</span>}
            name="company_address"
          >
            <Input.TextArea rows={2} placeholder="e.g. Annamalai Complex, New Busstand, Tirupattur Dist - 635601" style={{ borderRadius: 8 }} />
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
            <Input size="large" placeholder="e.g. dishamachinery@gmail.com" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>Phone / Contact Numbers</span>}
            name="company_phone"
          >
            <Input size="large" placeholder="e.g. 9751117889 / 9626957000 / 04179-2266666 / 294650" style={{ borderRadius: 8 }} />
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
            <Input size="large" placeholder="e.g. 33GPNPS1888N1ZT" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>PAN / Tax ID</span>}
            name="company_tax_number"
          >
            <Input size="large" placeholder="e.g. 33GPNPS1888N1ZT" style={{ borderRadius: 8 }} />
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
            label={<span style={{ fontWeight: 600, color: '#334155' }}>Company Registration / FY Series</span>}
            name="company_reg_number"
          >
            <Input size="large" placeholder="e.g. DM/26-27" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>

        {/* ===== BANK & PAYMENT DETAILS ===== */}
        <Col span={24}>
          <div
            style={{
              marginTop: 12,
              marginBottom: 8,
              fontWeight: 700,
              fontSize: 14,
              color: '#0f172a',
              borderTop: '1px solid #e2e8f0',
              paddingTop: 16,
            }}
          >
            🏦 Federal Bank Account & UPI Details (Printed on Tax Invoice)
          </div>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>Bank Name</span>}
            name="company_bank_name"
          >
            <Input size="large" placeholder="e.g. FEDERAL BANK" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>Account Number</span>}
            name="company_bank_account"
          >
            <Input size="large" placeholder="e.g. 20695500000537" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>IFSC Code</span>}
            name="company_bank_ifsc"
          >
            <Input size="large" placeholder="e.g. FDRL0002069" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>Branch</span>}
            name="company_bank_branch"
          >
            <Input size="large" placeholder="e.g. TIRUPATHUR" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#334155' }}>UPI / QR Payment ID</span>}
            name="company_upi"
            extra="Used to generate the dynamic QR code on the invoice for GPay / PhonePe / Paytm / Federal Bank"
          >
            <Input
              size="large"
              placeholder="e.g. 9751117889@federal or dishamachinery@upi"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
}
