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
    },
    {
      title: translate('Client'),
      dataIndex: ['client', 'name'],
    },
    {
      title: translate('Amount'),
      dataIndex: 'amount',
      onCell: () => {
        return {
          style: {
            textAlign: 'right',
            whiteSpace: 'nowrap',
            direction: 'ltr',
          },
        };
      },
      render: (amount, record) =>
        moneyFormatter({ amount: amount, currency_code: record.currency }),
    },
    {
      title: translate('Date'),
      dataIndex: 'date',
      render: (date) => {
        return dayjs(date).format(dateFormat);
      },
    },
    {
      title: 'Bill No',
      dataIndex: ['invoice', 'number'],
      render: (number, record) => `#${number || '-'}/${record?.invoice?.year || ''}`,
    },
    {
      title: translate('Payment Mode'),
      render: (_, record) => {
        const mode = record.method || record?.paymentMode?.name || 'cash';
        return <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{mode}</span>;
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
