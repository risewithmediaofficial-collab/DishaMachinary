import { useLayoutEffect } from 'react';
import { useEffect } from 'react';
import { selectAppSettings } from '@/redux/settings/selectors';
import { useDispatch, useSelector } from 'react-redux';

import { Layout } from 'antd';
import { useLocation } from 'react-router-dom';

import { useAppContext } from '@/context/appContext';

import Navigation from '@/apps/Navigation/NavigationContainer';

import HeaderContent from '@/apps/Header/HeaderContainer';
import PageLoader from '@/components/PageLoader';

import { settingsAction } from '@/redux/settings/actions';

import { selectSettings } from '@/redux/settings/selectors';

import AppRouter from '@/router/AppRouter';

import useResponsive from '@/hooks/useResponsive';

import storePersist from '@/redux/storePersist';

export default function ErpCrmApp() {
  const { Content } = Layout;
  const { pathname } = useLocation();
  const isPosRoute = pathname === '/pos';

  const { isMobile } = useResponsive();

  const dispatch = useDispatch();

  useLayoutEffect(() => {
    dispatch(settingsAction.list({ entity: 'setting' }));
  }, []);

  const { isSuccess: settingIsloaded } = useSelector(selectSettings);

  if (settingIsloaded)
    return (
      <Layout hasSider={!isMobile} className={isPosRoute ? 'pos-shell' : undefined}>
        <Navigation />

        {isMobile ? (
          <Layout className={isPosRoute ? 'pos-content-shell' : undefined} style={{ marginLeft: 0 }}>
            <HeaderContent />
            <Content
              className={isPosRoute ? 'pos-content' : undefined}
              style={{
                margin: '8px auto 16px',
                overflow: 'initial',
                width: '100%',
                padding: '0 8px',
                maxWidth: 'none',
              }}
            >
              <AppRouter />
            </Content>
          </Layout>
        ) : (
          <Layout
            className={isPosRoute ? 'pos-content-shell' : undefined}
            style={{
              marginLeft: 256,
              height: '100dvh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <HeaderContent />
            <Content
              className={isPosRoute ? 'pos-content' : undefined}
              style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '16px 32px 24px',
                maxWidth: '100%',
              }}
            >
              <div style={{ maxWidth: 1400, margin: '0 auto' }}>
                <AppRouter />
              </div>
            </Content>
          </Layout>
        )}
      </Layout>
    );
  else return <PageLoader />;
}
