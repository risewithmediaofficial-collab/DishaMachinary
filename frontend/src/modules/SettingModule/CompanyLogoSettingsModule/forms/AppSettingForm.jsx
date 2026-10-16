import { Button, Form, message, Upload } from 'antd';
import { UploadOutlined, FileImageOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';

export default function AppSettingForm() {
  const translate = useLanguage();

  const beforeUpload = (file) => {
    const isJpgOrPng =
      file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp';
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG/WebP image files!');
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Image must be smaller than 5MB!');
    }
    return false;
  };

  return (
    <div style={{ width: '100%', maxWidth: 540 }}>
      <div
        style={{
          border: '2px dashed #cbd5e1',
          borderRadius: 16,
          padding: '32px 24px',
          textAlign: 'center',
          background: '#f8fafc',
          marginBottom: 16,
        }}
      >
        <FileImageOutlined style={{ fontSize: 48, color: '#3b82f6', marginBottom: 12 }} />
        <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 6 }}>
          Upload Company Official Logo
        </div>
        <p style={{ color: '#64748b', fontSize: 13, margin: '0 auto 18px auto', maxWidth: 380 }}>
          Recommended: Transparent PNG or high-res JPG (min 400x120px). This logo will appear on all printed bills, receipts, and system headers.
        </p>

        <Form.Item
          name="file"
          valuePropName="fileList"
          getValueFromEvent={(e) => e.fileList}
          style={{ marginBottom: 0 }}
        >
          <Upload
            beforeUpload={beforeUpload}
            listType="picture"
            accept="image/png, image/jpeg, image/webp"
            maxCount={1}
          >
            <Button
              type="primary"
              ghost
              icon={<UploadOutlined />}
              size="large"
              style={{ borderRadius: 8, fontWeight: 600 }}
            >
              {translate('click_to_upload') || 'Choose Image File'}
            </Button>
          </Upload>
        </Form.Item>
      </div>
    </div>
  );
}
