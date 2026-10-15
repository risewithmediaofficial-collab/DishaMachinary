import { Tabs, Row, Col } from 'antd';
import useResponsive from '@/hooks/useResponsive';

const SettingsLayout = ({ children }) => {
  return (
    <Col className="gutter-row" order={0} xs={24} md={17} lg={18}>
      <div className="whiteBox shadow" style={{ minHeight: '360px', borderRadius: 12 }}>
        <div style={{ padding: '20px 16px' }}>{children}</div>
      </div>
    </Col>
  );
};

const TopCard = ({ pageTitle }) => {
  return (
    <div
      className="whiteBox shadow"
      style={{
        color: '#595959',
        fontSize: 13,
        height: '60px',
        minHeight: 'auto',
        marginBottom: '16px',
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <h2 style={{ color: '#0f172a', marginBottom: 0, marginTop: 0, fontSize: 18, fontWeight: 800 }}>{pageTitle}</h2>
    </div>
  );
};

const RightMenu = ({ children, pageTitle }) => {
  return (
    <Col
      className="gutter-row"
      xs={{ span: 24 }}
      sm={{ span: 24 }}
      md={{ span: 7 }}
      lg={{ span: 6 }}
      order={1}
    >
      <TopCard pageTitle={pageTitle} />
      <div className="whiteBox shadow" style={{ borderRadius: 12 }}>
        <div style={{ width: '100%', padding: '16px 12px' }}>
          {children}
        </div>
      </div>
    </Col>
  );
};

export default function TabsContent({ content, defaultActiveKey, pageTitle }) {
  const { isMobile } = useResponsive();

  const items = content.map((item, index) => {
    return {
      key: item.key ? item.key : index + '_' + item.label.replace(/ /g, '_'),
      label: (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {item.icon} <span style={{ paddingRight: 16 }}>{item.label}</span>
        </div>
      ),
      children: <SettingsLayout>{item.children}</SettingsLayout>,
    };
  });

  const renderTabBar = (props, DefaultTabBar) => (
    <RightMenu pageTitle={pageTitle}>
      <DefaultTabBar {...props} />
    </RightMenu>
  );

  return (
    <div className="tabContent" style={{ width: '100%' }}>
      <Tabs
        tabPosition={isMobile ? 'top' : 'right'}
        defaultActiveKey={defaultActiveKey}
        hideAdd={true}
        items={items}
        renderTabBar={renderTabBar}
      />
    </div>
  );
}

