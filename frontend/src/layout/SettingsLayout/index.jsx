import React from 'react';

import { Layout } from 'antd';
import { Divider, Row, Col } from 'antd';

const { Content } = Layout;

const TopCard = ({ title, cardContent }) => {
  return (
    <div
      className="whiteBox shadow"
      style={{
        color: '#595959',
        fontSize: 13,
        height: '70px',
        minHeight: 'auto',
        marginBottom: '24px',
      }}
    >
      <div className="pad20 strong" style={{ textAlign: 'center', justifyContent: 'center' }}>
        <h2 style={{ color: '#22075e', marginBottom: 0, marginTop: 0 }}>{title}</h2>
      </div>
      {/* <Divider style={{ padding: 0, margin: 0 }}></Divider>
      <div className="pad15" style={{ textAlign: 'center', justifyContent: 'center' }}>
        {cardContent}
      </div> */}
    </div>
  );
};

export default function SettingsLayout({
  children,
  topCardTitle,
  topCardContent,
  bottomCardContent,
}) {
  return (
    <Layout className="site-layout">
      <Content
        className="settings-layout-content"
        style={{
          margin: '0px auto',
          width: '100%',
          maxWidth: '1100px',
        }}
      >
        <Row gutter={[16, 16]}>
          <Col
            className="gutter-row"
            xs={{ span: 24 }}
            sm={{ span: 24 }}
            md={{ span: 17 }}
            lg={{ span: 18 }}
          >
            <div className="whiteBox shadow" style={{ minHeight: '380px', maxWidth: '800px', borderRadius: 12 }}>
              <Row className="pad40" gutter={[0, 0]}>
                <Col span={24}>{children}</Col>
              </Row>
            </div>
          </Col>
          <Col
            className="gutter-row"
            xs={{ span: 24 }}
            sm={{ span: 24 }}
            md={{ span: 7 }}
            lg={{ span: 6 }}
          >
            <TopCard title={topCardTitle} cardContent={topCardContent} />
            <div className="whiteBox shadow" style={{ minHeight: '200px', borderRadius: 12 }}>
              <Row gutter={[0, 0]}>{bottomCardContent}</Row>
            </div>
          </Col>
        </Row>
      </Content>
      <style>{`
        .settings-layout-content {
          padding: 30px 40px;
        }
        @media (max-width: 768px) {
          .settings-layout-content {
            padding: 8px 6px !important;
          }
        }
      `}</style>
    </Layout>
  );
}
