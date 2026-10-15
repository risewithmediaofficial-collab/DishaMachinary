import { ErpContextProvider } from '@/context/erp';

import { Layout } from 'antd';
import { useSelector } from 'react-redux';

const { Content } = Layout;

export default function ErpLayout({ children }) {
  return (
    <ErpContextProvider>
      <Content
        className="whiteBox shadow layoutPadding erp-layout-content"
        style={{
          margin: '8px auto 20px',
          width: '100%',
          maxWidth: '1100px',
          borderRadius: 12,
        }}
      >
        {children}
      </Content>
    </ErpContextProvider>
  );
}
