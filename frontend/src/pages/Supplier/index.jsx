import { Tag } from 'antd';
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
      title: 'Supplier / Ledger',
      dataIndex: 'name',
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{name}</div>
          {record.company && (
            <div style={{ fontSize: 12, color: '#64748b' }}>{record.company}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Contact',
      dataIndex: 'phone',
      render: (phone, record) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0284c7' }}>{phone}</div>
          {record.email && (
            <div style={{ fontSize: 11, color: '#64748b' }}>{record.email}</div>
          )}
        </div>
      ),
    },
    {
      title: 'GSTIN',
      dataIndex: 'gstin',
      render: (gstin) => (
        gstin ? <Tag color="blue" style={{ fontFamily: 'monospace' }}>{gstin}</Tag> : <span style={{ color: '#94a3b8' }}>Unregistered</span>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'city',
      render: (city, record) => (
        <span>
          {[city, record.state].filter(Boolean).join(', ') || 'Tamil Nadu'}
        </span>
      ),
    },
    {
      title: 'Opening Balance',
      dataIndex: 'openingBalance',
      align: 'right',
      render: (amount) => (
        <span style={{ fontWeight: 600, color: (amount || 0) > 0 ? '#b91c1c' : '#475569' }}>
          {moneyFormatter({ amount: amount || 0 })}
        </span>
      ),
    },
    {
      title: 'Bank Info',
      dataIndex: 'bankName',
      render: (bank, record) => (
        record.bankAccount ? (
          <div style={{ fontSize: 12 }}>
            <span style={{ fontWeight: 600 }}>{bank || 'Bank'}:</span> {record.bankAccount}
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
