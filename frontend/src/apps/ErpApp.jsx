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

  // const { state: stateApp, appContextAction } = useAppContext();
  // // const { app } = appContextAction;
  // const { isNavMenuClose, currentApp } = stateApp;

  const { isMobile } = useResponsive();

  const dispatch = useDispatch();

  useLayoutEffect(() => {
    dispatch(settingsAction.list({ entity: 'setting' }));
  }, []);

  // const appSettings = useSelector(selectAppSettings);

  const { isSuccess: settingIsloaded } = useSelector(selectSettings);

  // useEffect(() => {
  //   const { loadDefaultLang } = storePersist.get('firstVisit');
  //   if (appSettings.idurar_app_language && !loadDefaultLang) {
  //     window.localStorage.setItem('firstVisit', JSON.stringify({ loadDefaultLang: true }));
  //   }
  // }, [appSettings]);

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
                margin: '10px auto 20px',
                overflow: 'initial',
                width: '100%',
                padding: '0 12px',
                maxWidth: 'none',
              }}
            >
              <AppRouter />
            </Content>
          </Layout>
        ) : (
          <Layout className={isPosRoute ? 'pos-content-shell' : undefined}>
            <HeaderContent />
            <Content
              className={isPosRoute ? 'pos-content' : undefined}
              style={{
                margin: '16px auto 24px',
                overflow: 'initial',
                width: '100%',
                padding: '0 32px',
                maxWidth: 1400,
              }}
            >
              <AppRouter />
            </Content>
          </Layout>
        )}
      </Layout>
    );
  else return <PageLoader />;
}
