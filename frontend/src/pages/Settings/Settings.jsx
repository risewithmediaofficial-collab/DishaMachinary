import {
  SettingOutlined,
  CreditCardOutlined,
  FileImageOutlined,
  TrophyOutlined,
} from '@ant-design/icons';

import TabsContent from '@/components/TabsContent/TabsContent';

import CompanyLogoSettings from './CompanyLogoSettings';
import GeneralSettings from './GeneralSettings';
import CompanySettings from './CompanySettings';
import FinanceSettings from './FinanceSettings';
import MoneyFormatSettings from './MoneyFormatSettings';

import useLanguage from '@/locale/useLanguage';
import { useParams } from 'react-router-dom';

export default function Settings() {
  const translate = useLanguage();
  const { settingsKey } = useParams();

  const content = [
    {
      key: 'general_settings',
      label: translate('General Settings'),
      description: 'Date format, system email & core preferences',
      icon: <SettingOutlined />,
      color: '#2563eb',
      children: <GeneralSettings />,
    },
    {
      key: 'company_settings',
      label: translate('Company Settings'),
      description: 'Business name, GSTIN, phone & address',
      icon: <TrophyOutlined />,
      color: '#d97706',
      children: <CompanySettings />,
    },
    {
      key: 'company_logo',
      label: translate('Company Logo'),
      description: 'Upload company logo for bills and headers',
      icon: <FileImageOutlined />,
      color: '#7c3aed',
      children: <CompanyLogoSettings />,
    },
    {
      key: 'currency_settings',
      label: translate('Currency Settings'),
      description: 'Currency symbol (₹), decimals & formatting',
      icon: <span aria-hidden="true" style={{ fontWeight: 800, fontSize: 16 }}>₹</span>,
      color: '#059669',
      children: <MoneyFormatSettings />,
    },
    {
      key: 'finance_settings',
      label: translate('Finance Settings'),
      description: 'Financial year, payment terms & invoice defaults',
      icon: <CreditCardOutlined />,
      color: '#4f46e5',
      children: <FinanceSettings />,
    },
  ];

  const pageTitle = translate('Settings');

  return <TabsContent defaultActiveKey={settingsKey || 'general_settings'} content={content} pageTitle={pageTitle} />;
}
