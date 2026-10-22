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
    <div className="settings-page-wrapper">
      {/* TOP HEADER BANNER */}
      <div className="settings-header-banner">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb',
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              <SettingOutlined />
            </div>
            <h1 className="settings-page-title">
              {pageTitle || 'System Settings & Preferences'}
            </h1>
            <Tag color="blue" style={{ fontWeight: 700, borderRadius: 12, marginLeft: 4 }}>
              ERP
            </Tag>
          </div>
          <p className="settings-page-subtitle">
            Manage your company profile, currency standards, logo branding, and system configurations
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag
            color="success"
            icon={<CheckCircleOutlined />}
            style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600 }}
          >
            System Synced
          </Tag>
        </div>
      </div>

      {/* TWO-COLUMN LAYOUT: NAVIGATION + CONTENT */}
      <Row gutter={[20, 20]} style={{ alignItems: 'flex-start' }}>
        {/* NAVIGATION SIDEBAR */}
        <Col xs={24} md={8} lg={7} className="settings-nav-col">
          <div className="settings-sidebar-static">
            <div className="settings-sidebar-header">
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

            <div className="settings-sidebar-list">
              {content.map((item) => {
                const isActive = item.key === activeKey;
                const itemColor = item.color || '#2563eb';

                return (
                  <div
                    key={item.key}
                    onClick={() => handleSelectTab(item.key)}
                    className={`settings-tab-item ${isActive ? 'active' : ''}`}
                    style={{
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
                      className="settings-tab-icon"
                      style={{
                        background: isActive ? itemColor : '#f1f5f9',
                        color: isActive ? '#ffffff' : '#64748b',
                      }}
                    >
                      {item.icon}
                    </div>

                    {/* LABEL & DESCRIPTION */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        className="settings-tab-label"
                        style={{
                          fontWeight: isActive ? 800 : 600,
                          color: isActive ? '#1d4ed8' : '#1e293b',
                        }}
                      >
                        {item.label}
                      </div>
                      {item.description && (
                        <div
                          className="settings-tab-desc"
                          style={{
                            color: isActive ? '#3b82f6' : '#94a3b8',
                          }}
                        >
                          {item.description}
                        </div>
                      )}
                    </div>

                    {/* RIGHT CHEVRON */}
                    <RightOutlined
                      className="settings-tab-chevron"
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

        {/* ACTIVE CONTENT CARD WITH INLINE SCROLL */}
        <Col xs={24} md={16} lg={17}>
          <div className="settings-content-card">
            {activeItem?.children}
          </div>
        </Col>
      </Row>

      <style>{`
        .settings-page-wrapper {
          max-width: 1360px;
          margin: 0 auto;
          padding: 16px;
        }
        .settings-header-banner {
          background: #ffffff;
          border-radius: 16px;
          padding: 20px 24px;
          border: 1px solid #e2e8f0;
          margin-bottom: 24px;
          box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }
        .settings-page-title {
          margin: 0;
          font-size: 22px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.02em;
        }
        .settings-page-subtitle {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 13px;
        }
        .settings-nav-col {
          position: sticky;
          top: 20px;
          z-index: 10;
        }
        .settings-sidebar-static {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.05);
          overflow: hidden;
        }
        .settings-sidebar-header {
          padding: 18px 20px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #fafafa;
        }
        .settings-sidebar-list {
          padding: 12px 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .settings-tab-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 14px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .settings-tab-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .settings-tab-label {
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .settings-tab-desc {
          font-size: 11.5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 2px;
        }
        .settings-content-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
          padding: 28px 32px;
          min-height: 480px;
          max-height: calc(100vh - 190px);
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }
        .settings-content-card::-webkit-scrollbar {
          width: 6px;
        }
        .settings-content-card::-webkit-scrollbar-track {
          background: transparent;
        }
        .settings-content-card::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 9999px;
        }

        @media (max-width: 768px) {
          .settings-page-wrapper {
            padding: 0 0 24px;
          }
          .settings-header-banner {
            padding: 14px 14px;
            border-radius: 14px;
            margin-bottom: 12px;
            gap: 10px;
          }
          .settings-page-title {
            font-size: 18px;
          }
          .settings-page-subtitle {
            font-size: 12px;
          }
          .settings-nav-col {
            position: static !important;
            margin-bottom: 2px;
          }
          .settings-sidebar-static {
            border-radius: 12px !important;
            box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
          }
          .settings-sidebar-header {
            display: none !important;
          }
          .settings-sidebar-list {
            display: flex !important;
            flex-direction: row !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            padding: 8px 8px !important;
            gap: 8px !important;
            scrollbar-width: none !important;
          }
          .settings-sidebar-list::-webkit-scrollbar {
            display: none !important;
          }
          .settings-tab-item {
            flex: 0 0 auto !important;
            padding: 8px 12px !important;
            gap: 8px !important;
            border-radius: 10px !important;
          }
          .settings-tab-icon {
            width: 28px !important;
            height: 28px !important;
            font-size: 14px !important;
            border-radius: 7px !important;
          }
          .settings-tab-label {
            font-size: 12.5px !important;
          }
          .settings-tab-desc,
          .settings-tab-chevron {
            display: none !important;
          }
          .settings-content-card {
            padding: 16px 14px !important;
            border-radius: 14px !important;
            max-height: none !important;
            overflow-y: visible !important;
            min-height: auto !important;
          }
        }
      `}</style>
    </div>
  );
}
