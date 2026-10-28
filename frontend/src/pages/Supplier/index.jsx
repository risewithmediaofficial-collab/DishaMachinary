import { Tag, Tooltip } from 'antd';
import CrudModule from '@/modules/CrudModule/CrudModule';
import DynamicForm from '@/forms/DynamicForm';
import { fields } from './config';
import useLanguage from '@/locale/useLanguage';
import { useMoney } from '@/settings';

export default function Supplier() {
  const translate = useLanguage();
  const { moneyFormatter } = useMoney();
  const entity = 'supplier';

  const searchConfig = {
    displayLabels: ['name', 'company', 'phone', 'gstin'],
    searchFields: 'name,company,phone,gstin',
  };
  const deleteModalLabels = ['name', 'phone'];

  const Labels = {
    PANEL_TITLE: 'Suppliers & Vendors',
    DATATABLE_TITLE: 'Suppliers Directory (Authorized Inventory Sources)',
    ADD_NEW_ENTITY: 'Add New Supplier',
    ENTITY_NAME: 'Supplier',
  };

  const dataTableColumns = [
    {
      title: 'Supplier Name / Firm',
      dataIndex: 'name',
      width: 220,
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5 }}>{name}</div>
          {record.company && (
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>🏢 {record.company}</div>
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
      title: 'Address & City',
      dataIndex: 'address',
      width: 240,
      render: (address, record) => {
        const fullAddr = [address, record.city, record.state, record.pincode].filter(Boolean).join(', ');
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
    {
      title: 'Bank Information',
      dataIndex: 'bankName',
      width: 200,
      render: (bank, record) => (
        record.bankAccount ? (
          <div style={{ fontSize: 12 }}>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{bank || 'Bank'}:</span> {record.bankAccount}
            {record.bankIfsc && <div style={{ fontSize: 11, color: '#64748b' }}>IFSC: {record.bankIfsc}</div>}
          </div>
        ) : (
          <span style={{ color: '#94a3b8' }}>-</span>
        )
      ),
    },
  ];

  const config = {
    entity,
    ...Labels,
    fields,
    searchConfig,
    deleteModalLabels,
    dataTableColumns,
  };

  return (
    <CrudModule
      createForm={<DynamicForm fields={fields} />}
      updateForm={<DynamicForm fields={fields} isUpdateForm={true} />}
      config={config}
    />
  );
}
