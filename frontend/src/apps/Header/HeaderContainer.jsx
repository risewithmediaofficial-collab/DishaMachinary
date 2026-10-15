import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, Dropdown, Layout, Button } from 'antd';

import { LogoutOutlined, ToolOutlined, UserOutlined, MenuOutlined } from '@ant-design/icons';
import { selectCurrentAdmin } from '@/redux/auth/selectors';
import { FILE_BASE_URL } from '@/config/serverApiConfig';
import useLanguage from '@/locale/useLanguage';
import useResponsive from '@/hooks/useResponsive';
import { useAppContext } from '@/context/appContext';

import UpgradeButton from './UpgradeButton';

export default function HeaderContent() {
  const currentAdmin = useSelector(selectCurrentAdmin);
  const { Header } = Layout;
  const { isMobile } = useResponsive();
  const { appContextAction } = useAppContext();

  const translate = useLanguage();

  const ProfileDropdown = () => {
    const navigate = useNavigate();
    return (
      <div className="profileDropdown" onClick={() => navigate('/profile')}>
        <Avatar
          size="large"
          className="last"
          src={currentAdmin?.photo ? FILE_BASE_URL + currentAdmin?.photo : undefined}
          style={{
            color: '#f56a00',
            backgroundColor: currentAdmin?.photo ? 'none' : '#fde3cf',
            boxShadow: 'rgba(150, 190, 238, 0.35) 0px 0px 6px 1px',
          }}
        >
          {currentAdmin?.name?.charAt(0)?.toUpperCase()}
        </Avatar>
        <div className="profileDropdownInfo">
          <p>
            {currentAdmin?.name} {currentAdmin?.surname}
          </p>
          <p>{currentAdmin?.email}</p>
        </div>
      </div>
    );
  };

  const DropdownMenu = ({ text }) => {
    return <span>{text}</span>;
  };

  const items = [
    {
      label: <ProfileDropdown className="headerDropDownMenu" />,
      key: 'ProfileDropdown',
    },
    {
      type: 'divider',
    },
    {
      icon: <UserOutlined />,
      key: 'settingProfile',
      label: (
        <Link to={'/profile'}>
          <DropdownMenu text={translate('profile_settings')} />
        </Link>
      ),
    },
    {
      icon: <ToolOutlined />,
      key: 'settingApp',
      label: <Link to={'/settings'}>{translate('app_settings')}</Link>,
    },

    {
      type: 'divider',
    },

    {
      icon: <LogoutOutlined />,
      key: 'logout',
      label: <Link to={'/logout'}>{translate('logout')}</Link>,
    },
  ];

  return (
    <Header
      style={{
        padding: isMobile ? '0 14px' : '0 24px',
        height: '64px',
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 999,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {isMobile && (
          <Button
            type="text"
            icon={<MenuOutlined style={{ fontSize: 19, color: '#0f172a' }} />}
            onClick={() => appContextAction.mobileMenu.toggle()}
            style={{ width: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
          />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 800, fontSize: isMobile ? 15 : 16, color: '#0f172a', letterSpacing: -0.2 }}>
            Disha Machinary
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#2563eb',
              background: '#eff6ff',
              padding: '0 6px',
              borderRadius: 4,
              border: '1px solid #dbeafe',
              display: 'inline-flex',
              alignItems: 'center',
              height: 20,
              lineHeight: '18px',
              verticalAlign: 'middle',
            }}
          >
            ERP
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <UpgradeButton />
        <Dropdown
          menu={{
            items,
          }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Avatar
            className="last"
            src={currentAdmin?.photo ? FILE_BASE_URL + currentAdmin?.photo : undefined}
            style={{
              color: '#f56a00',
              backgroundColor: currentAdmin?.photo ? 'none' : '#fde3cf',
              boxShadow: 'rgba(150, 190, 238, 0.35) 0px 0px 8px 1px',
              cursor: 'pointer',
            }}
            size="large"
          >
            {currentAdmin?.name?.charAt(0)?.toUpperCase()}
          </Avatar>
        </Dropdown>
      </div>
    </Header>
  );
}

