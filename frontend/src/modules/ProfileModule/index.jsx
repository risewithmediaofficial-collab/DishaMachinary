import Profile from './components/Profile';
import ProfileLayout from '@/layout/ProfileLayout';
import { Layout } from 'antd';
import { Content } from 'antd/lib/layout/layout';

export default function ProfileModule({ config }) {
  return (
    <ProfileLayout>
      <Layout className="site-layout">
        <Content
          className="whiteBox shadow profile-module-content"
          style={{
            margin: '16px auto',
            width: '100%',
            maxWidth: '1100px',
            borderRadius: 14,
          }}
        >
          <Profile config={config} />
        </Content>
      </Layout>
      <style>{`
        .profile-module-content {
          padding: 36px 32px;
        }
        @media (max-width: 768px) {
          .profile-module-content {
            padding: 16px 14px !important;
            margin: 8px auto !important;
            border-radius: 12px !important;
          }
        }
      `}</style>
    </ProfileLayout>
  );
}
