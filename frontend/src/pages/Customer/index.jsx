import { Tag, Tooltip } from 'antd';
import CrudModule from '@/modules/CrudModule/CrudModule';
import DynamicForm from '@/forms/DynamicForm';
import { fields } from './config';

import useLanguage from '@/locale/useLanguage';
import { useMoney } from '@/settings';

export default function Customer() {
  const translate = useLanguage();
  const { moneyFormatter } = useMoney();
  const entity = 'client';
  const searchConfig = {
    displayLabels: ['name', 'phone', 'gstin'],
    searchFields: 'name,phone,gstin,businessName',
  };
  const deleteModalLabels = ['name'];

  const Labels = {
    PANEL_TITLE: translate('client'),
    DATATABLE_TITLE: translate('client_list'),
    ADD_NEW_ENTITY: translate('add_new_client'),
    ENTITY_NAME: translate('client'),
  };

  const dataTableColumns = [
    {
      title: 'Customer / Business Name',
      dataIndex: 'name',
      width: 220,
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5 }}>{name}</div>
          {record.businessName && (
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>🏢 {record.businessName}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Contact Details',
      dataIndex: 'phone',
      width: 170,
      render: (phone, record) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0284c7', fontSize: 13 }}>📞 {phone}</div>
          {record.email && (
            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>✉️ {record.email}</div>
          )}
        </div>
      ),
    },
    {
      title: 'GSTIN',
      dataIndex: 'gstin',
      width: 160,
      render: (gstin) => (
        gstin ? (
          <Tag color="blue" style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, padding: '2px 8px' }}>
            {gstin}
          </Tag>
        ) : (
          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unregistered</span>
        )
      ),
    },
    {
      title: 'Address & State',
      dataIndex: 'address',
      width: 240,
      render: (address, record) => {
        const fullAddr = [address, record.state, record.country].filter(Boolean).join(', ');
        return (
          <Tooltip title={fullAddr}>
            <div style={{ color: '#334155', fontSize: 12, lineHeight: 1.35 }}>
              {fullAddr || 'Tamil Nadu'}
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: 'Opening Balance',
      dataIndex: 'openingBalance',
      width: 140,
      align: 'right',
      render: (amount) => (
        <span style={{ fontWeight: 700, color: (amount || 0) > 0 ? '#b91c1c' : '#475569', fontSize: 13 }}>
          {moneyFormatter({ amount: amount || 0 })}
        </span>
      ),
    },
  ];

  const configPage = {
    entity,
    ...Labels,
  };
  const config = {
    ...configPage,
    fields,
    searchConfig,
    deleteModalLabels,
    dataTableColumns,
  };
  return (
    <CrudModule
      createForm={<DynamicForm fields={fields} />}
      updateForm={<DynamicForm fields={fields} />}
      config={config}
    />
  );
}
