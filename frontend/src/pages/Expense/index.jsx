import dayjs from 'dayjs';
import CrudModule from '@/modules/CrudModule/CrudModule';
import DynamicForm from '@/forms/DynamicForm';
import { useMoney } from '@/settings';

const fields = {
  date: { type: 'date', required: true },
  category: {
    type: 'select', required: true,
    options: ['rent', 'salary', 'electricity', 'repairs', 'transport', 'miscellaneous'].map((value) => ({ value, label: value })),
  },
  amount: { type: 'currency', required: true },
  paymentAccount: { type: 'string', label: 'Payment Account', required: true },
  description: { type: 'textarea' },
};

export default function Expense() {
  const { moneyFormatter } = useMoney();
  const config = {
    entity: 'expense',
    PANEL_TITLE: 'Expenses',
    DATATABLE_TITLE: 'Expense Register',
    ADD_NEW_ENTITY: 'Record Expense',
    ENTITY_NAME: 'Expense',
    fields,
    searchConfig: { searchFields: 'category,description,paymentAccount' },
    deleteModalLabels: ['category', 'description'],
    dataTableColumns: [
      { title: 'Date', dataIndex: 'date', render: (value) => dayjs(value).format('DD/MM/YYYY') },
      { title: 'Category', dataIndex: 'category' },
      { title: 'Account', dataIndex: 'paymentAccount' },
      { title: 'Description', dataIndex: 'description' },
      { title: 'Amount', dataIndex: 'amount', render: (value) => moneyFormatter({ amount: value }) },
    ],
  };
  return <CrudModule createForm={<DynamicForm fields={fields} />} updateForm={<DynamicForm fields={fields} />} config={config} />;
}
