import { Tag } from 'antd';
import UpdateSettingForm from './UpdateSettingForm';

export default function UpdateSettingModule({
  config,
  children,
  withUpload = false,
  uploadSettingKey = null,
}) {
  return (
    <div style={{ width: '100%' }}>
      {/* SECTION HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          paddingBottom: 20,
          marginBottom: 24,
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: '#0f172a',
              margin: '0 0 4px 0',
              letterSpacing: '-0.01em',
            }}
          >
            {config.SETTINGS_TITLE}
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
            Review and configure settings for this section
          </p>
        </div>

        <Tag color="blue" style={{ fontWeight: 700, borderRadius: 12, padding: '3px 10px' }}>
          Config
        </Tag>
      </div>

      <UpdateSettingForm
        config={config}
        withUpload={withUpload}
        uploadSettingKey={uploadSettingKey}
      >
        {children}
      </UpdateSettingForm>
    </div>
  );
}
