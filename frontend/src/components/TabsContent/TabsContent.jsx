import { useState, useEffect } from 'react';
import { Row, Col, Card, Tag } from 'antd';
import {
  SettingOutlined,
  RightOutlined,
  CheckCircleOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';

export default function TabsContent({ content, defaultActiveKey, pageTitle }) {
  const navigate = useNavigate();
  const { settingsKey } = useParams();

  // Determine active key from props or URL
  const initialKey = defaultActiveKey || settingsKey || (content.length > 0 ? content[0].key : '');
  const [activeKey, setActiveKey] = useState(initialKey);

  useEffect(() => {
    if (settingsKey && content.some((item) => item.key === settingsKey)) {
      setActiveKey(settingsKey);
    }
  }, [settingsKey, content]);

  const activeItem = content.find((item) => item.key === activeKey) || content[0];

  const handleSelectTab = (key) => {
    setActiveKey(key);
    // Optionally update URL smoothly without reload
    navigate(`/settings/edit/${key}`, { replace: true });
  };

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto', padding: '16px' }}>
      {/* TOP HEADER BANNER */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
          borderRadius: 16,
          padding: '24px 28px',
          color: '#ffffff',
          marginBottom: 24,
          boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SettingOutlined style={{ fontSize: 26, color: '#60a5fa' }} />
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#ffffff', letterSpacing: 0.3 }}>
              {pageTitle || 'System Settings & Preferences'}
            </h1>
            <Tag color="blue" style={{ fontWeight: 700, borderRadius: 12, marginLeft: 6 }}>
              Enterprise ERP
            </Tag>
          </div>
          <p style={{ margin: '6px 0 0', color: '#cbd5e1', fontSize: 13 }}>
            Manage your company profile, currency standards, logo branding, and system configurations
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag
            color="success"
            icon={<CheckCircleOutlined />}
            style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}
          >
            System Online & Synced
          </Tag>
        </div>
      </div>

      {/* TWO-COLUMN LAYOUT: NAVIGATION + CONTENT */}
      <Row gutter={[24, 24]}>
        {/* NAVIGATION SIDEBAR */}
        <Col xs={24} md={8} lg={7}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.05)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '18px 20px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#fafafa',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AppstoreOutlined style={{ color: '#2563eb', fontSize: 16 }} />
                <span style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', letterSpacing: 0.2 }}>
                  SETTINGS MENU
                </span>
              </div>
              <Tag style={{ margin: 0, borderRadius: 10, fontWeight: 700, fontSize: 11 }}>
                {content.length} Sections
              </Tag>
            </div>

            <div style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {content.map((item) => {
                const isActive = item.key === activeKey;
                const itemColor = item.color || '#2563eb';

                return (
                  <div
                    key={item.key}
                    onClick={() => handleSelectTab(item.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '12px 14px',
                      borderRadius: 12,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      background: isActive ? '#eff6ff' : 'transparent',
                      border: isActive ? `1.5px solid #bfdbfe` : '1.5px solid transparent',
                      boxShadow: isActive ? '0 2px 8px rgba(37, 99, 235, 0.08)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* ICON CONTAINER */}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        flexShrink: 0,
                        background: isActive ? itemColor : '#f1f5f9',
                        color: isActive ? '#ffffff' : '#64748b',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {item.icon}
                    </div>

                    {/* LABEL & DESCRIPTION */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: isActive ? 800 : 600,
                          fontSize: 14,
                          color: isActive ? '#1d4ed8' : '#1e293b',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.label}
                      </div>
                      {item.description && (
                        <div
                          style={{
                            fontSize: 11.5,
                            color: isActive ? '#3b82f6' : '#94a3b8',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            marginTop: 2,
                          }}
                        >
                          {item.description}
                        </div>
                      )}
                    </div>

                    {/* RIGHT CHEVRON */}
                    <RightOutlined
                      style={{
                        fontSize: 12,
                        color: isActive ? '#2563eb' : '#cbd5e1',
                        transition: 'transform 0.2s ease',
                        transform: isActive ? 'translateX(2px)' : 'none',
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </Col>

        {/* ACTIVE CONTENT CARD */}
        <Col xs={24} md={16} lg={17}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
              padding: '28px 32px',
              minHeight: 520,
            }}
          >
            {activeItem?.children}
          </div>
        </Col>
      </Row>
    </div>
  );
}
