import dayjs from 'dayjs';
import useLanguage from '@/locale/useLanguage';
import PaymentDataTableModule from '@/modules/PaymentModule/PaymentDataTableModule';

import { useMoney, useDate } from '@/settings';

export default function Payment() {
  const translate = useLanguage();
  const { dateFormat } = useDate();
  const { moneyFormatter } = useMoney();
  const searchConfig = {
    entity: 'client',
    displayLabels: ['number'],
    searchFields: 'number',
    outputValue: '_id',
  };

  const deleteModalLabels = ['number'];
  const dataTableColumns = [
    {
      title: translate('Number'),
      dataIndex: 'number',
      width: 100,
      render: (number) => <strong>#{number}</strong>,
    },
    {
      title: translate('Client'),
      dataIndex: ['client', 'name'],
      width: 180,
      ellipsis: true,
      render: (name) => <span style={{ fontWeight: 600 }}>{name || 'Walk-in Customer'}</span>,
    },
    {
      title: translate('Amount'),
      dataIndex: 'amount',
      width: 130,
      align: 'right',
      onCell: () => ({
        style: {
          textAlign: 'right',
          whiteSpace: 'nowrap',
          direction: 'ltr',
        },
      }),
      render: (amount, record) => (
        <span style={{ fontWeight: 700, color: '#16a34a' }}>
          {moneyFormatter({ amount: amount, currency_code: record.currency })}
        </span>
      ),
    },
    {
      title: translate('Date'),
      dataIndex: 'date',
      width: 120,
      render: (date) => dayjs(date).format(dateFormat),
    },
    {
      title: 'Bill No',
      dataIndex: ['invoice', 'number'],
      width: 120,
      render: (number, record) => `#${number || '-'}/${record?.invoice?.year || ''}`,
    },
    {
      title: translate('Payment Mode'),
      dataIndex: 'method',
      width: 140,
      render: (_, record) => {
        const mode = record.method || record?.paymentMode?.name || 'cash';
        return <Tag color="blue" style={{ textTransform: 'uppercase', fontWeight: 600 }}>{mode}</Tag>;
      },
    },
  ];

  const entity = 'payment';

  const Labels = {
    PANEL_TITLE: translate('payment'),
    DATATABLE_TITLE: translate('payment_list'),
    ADD_NEW_ENTITY: translate('add_new_payment'),
    ENTITY_NAME: translate('payment'),
  };

  const configPage = {
    entity,
    ...Labels,
  };
  const config = {
    ...configPage,
    disableAdd: true,
    dataTableColumns,
    searchConfig,
    deleteModalLabels,
  };
  return <PaymentDataTableModule config={config} />;
}
