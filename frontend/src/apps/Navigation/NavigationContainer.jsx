import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Drawer, Layout, Menu } from 'antd';

import { useAppContext } from '@/context/appContext';

import useLanguage from '@/locale/useLanguage';
import logoIcon from '@/style/images/logo-icon.svg';
import brandLogo from '@/style/images/disha-machinary.svg';

import useResponsive from '@/hooks/useResponsive';

import {
  SettingOutlined,
  CustomerServiceOutlined,
  AppstoreOutlined,
  InboxOutlined,
  ContainerOutlined,
  DashboardOutlined,
  TagOutlined,
  TagsOutlined,
  UserOutlined,
  CreditCardOutlined,
  MenuOutlined,
  FileOutlined,
  FilterOutlined,
  ReconciliationOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

export default function Navigation() {
  const { isMobile } = useResponsive();

  return isMobile ? <MobileSidebar /> : <Sidebar collapsible={false} />;
}

function Sidebar({ collapsible, isMobile = false, onItemClick }) {
  let location = useLocation();

  const { state: stateApp, appContextAction } = useAppContext();
  const { isNavMenuClose } = stateApp;
  const { navMenu } = appContextAction;
  const [showLogoApp, setLogoApp] = useState(isNavMenuClose);
  const routeKey = location.pathname.split('/').filter(Boolean)[0] || 'dashboard';
  const selectedKey = routeKey === 'settings' ? 'generalSettings' : routeKey;

  const translate = useLanguage();
  const navigate = useNavigate();

  const handleNavClick = (path) => {
    if (onItemClick) {
      onItemClick();
    }
  };

  const items = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: <Link to={'/'}>{translate('dashboard')}</Link>,
    },
    {
      key: 'pos',
      icon: <ShoppingCartOutlined />,
      label: <Link to={'/pos'}>Billing</Link>,
    },
    {
      key: 'customer',
      icon: <CustomerServiceOutlined />,
      label: <Link to={'/customer'}>{translate('customers')}</Link>,
    },
    {
      key: 'product',
      icon: <AppstoreOutlined />,
      label: <Link to={'/product'}>Products</Link>,
    },
    {
      key: 'inventory',
      icon: <InboxOutlined />,
      label: <Link to={'/inventory'}>Inventory</Link>,
    },

    {
      key: 'invoice',
      icon: <ContainerOutlined />,
      label: <Link to={'/invoice'}>{translate('invoices')}</Link>,
    },
    {
      key: 'payment',
      icon: <CreditCardOutlined />,
      label: <Link to={'/payment'}>{translate('payments')}</Link>,
    },
    {
      key: 'expense',
      icon: <CreditCardOutlined />,
      label: <Link to={'/expense'}>Expenses</Link>,
    },

    {
      key: 'generalSettings',
      label: <Link to={'/settings'}>{translate('settings')}</Link>,
      icon: <SettingOutlined />,
    },
    {
      key: 'about',
      label: <Link to={'/about'}>{translate('about')}</Link>,
      icon: <ReconciliationOutlined />,
    },
  ];

  useEffect(() => {
    if (isNavMenuClose) {
      setLogoApp(isNavMenuClose);
    }
    const timer = setTimeout(() => {
      if (!isNavMenuClose) {
        setLogoApp(isNavMenuClose);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [isNavMenuClose]);

  const onCollapse = () => {
    navMenu.collapse();
  };

  return (
    <Sider
      collapsible={collapsible}
      collapsed={collapsible ? isNavMenuClose : collapsible}
      onCollapse={onCollapse}
      className="navigation"
      width={isMobile ? 280 : 256}
      style={{
        height: isMobile ? '100%' : '100dvh',
        minHeight: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        position: isMobile ? 'relative' : 'sticky',
        top: 0,
        left: 0,
        width: isMobile ? '100%' : 256,
      }}
      theme={'light'}
    >
      <div
        className="logo"
        onClick={() => {
          navigate('/');
          if (onItemClick) onItemClick();
        }}
        style={{
          cursor: 'pointer',
        }}
      >
        {showLogoApp && !isMobile ? (
          <img src={logoIcon} alt="Disha Machinary" style={{ marginLeft: '-5px', height: '40px' }} />
        ) : (
          <>
            <img
              src={brandLogo}
              alt="Disha Machinary"
              style={{
                marginTop: '3px',
                height: '38px',
                maxWidth: '220px',
              }}
            />
            <span className="logo-badge">Industrial ERP</span>
          </>
        )}
      </div>
      <Menu
        items={items}
        mode="inline"
        theme={'light'}
        selectedKeys={[selectedKey]}
        onClick={handleNavClick}
        style={{
          width: '100%',
        }}
      />
    </Sider>
  );
}

function MobileSidebar() {
  const { state: stateApp, appContextAction } = useAppContext();
  const { isMobileMenuOpen } = stateApp;

  return (
    <Drawer
      width={280}
      placement="left"
      closable={false}
      onClose={() => appContextAction.mobileMenu.close()}
      open={isMobileMenuOpen}
      styles={{ body: { padding: 0 } }}
      maskClosable={true}
    >
      <Sidebar collapsible={false} isMobile={true} onItemClick={() => appContextAction.mobileMenu.close()} />
    </Drawer>
  );
}

