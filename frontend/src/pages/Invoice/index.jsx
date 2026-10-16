import dayjs from 'dayjs';
import { Tag } from 'antd';
import useLanguage from '@/locale/useLanguage';
import { tagColor } from '@/utils/statusTagColor';

import { useMoney, useDate } from '@/settings';
import InvoiceDataTableModule from '@/modules/InvoiceModule/InvoiceDataTableModule';

export default function Invoice() {
  const translate = useLanguage();
  const { dateFormat } = useDate();
  const entity = 'invoice';
  const { moneyFormatter } = useMoney();

  const searchConfig = {
    entity: 'client',
    displayLabels: ['name'],
    searchFields: 'name',
  };
  const deleteModalLabels = ['number', 'client.name'];
  const dataTableColumns = [
    {
      title: translate('Number'),
      dataIndex: 'number',
      width: 100,
      render: (number) => (
        <span style={{ fontWeight: 700, color: '#0f172a' }}>
          #{number}
        </span>
      ),
    },
    {
      title: translate('Client'),
      dataIndex: ['client', 'name'],
      width: 180,
      ellipsis: true,
      render: (name) => (
        <span style={{ fontWeight: 600, color: '#0f172a' }}>
          {name || 'Walk-in Customer'}
        </span>
      ),
    },
    {
      title: translate('Date'),
      dataIndex: 'date',
      width: 120,
      render: (date) => (
        <span style={{ color: '#475569' }}>
          {dayjs(date).format(dateFormat)}
        </span>
      ),
    },
    {
      title: translate('expired Date'),
      dataIndex: 'expiredDate',
      width: 125,
      render: (date) => (
        <span style={{ color: '#475569' }}>
          {dayjs(date).format(dateFormat)}
        </span>
      ),
    },
    {
      title: translate('Total'),
      dataIndex: 'total',
      width: 130,
      align: 'right',
      onCell: () => ({
        style: {
          textAlign: 'right',
          whiteSpace: 'nowrap',
          direction: 'ltr',
        },
      }),
      render: (total, record) => (
        <span style={{ fontWeight: 600, color: '#0f172a' }}>
          {moneyFormatter({ amount: total, currency_code: record.currency })}
        </span>
      ),
    },
    {
      title: translate('paid'),
      dataIndex: 'credit',
      width: 130,
      align: 'right',
      onCell: () => ({
        style: {
          textAlign: 'right',
          whiteSpace: 'nowrap',
          direction: 'ltr',
        },
      }),
      render: (credit, record) => (
        <span style={{ fontWeight: 600, color: (credit || 0) > 0 ? '#16a34a' : '#64748b' }}>
          {moneyFormatter({ amount: credit || 0, currency_code: record.currency })}
        </span>
      ),
    },
    {
      title: 'Balance Due',
      dataIndex: 'balance',
      width: 140,
      align: 'right',
      onCell: () => ({
        style: {
          textAlign: 'right',
          whiteSpace: 'nowrap',
          direction: 'ltr',
        },
      }),
      render: (_, record) => {
        const balance = Math.max(0, Number(record.total || 0) - Number(record.credit || 0));
        return (
          <span style={{ fontWeight: 700, color: balance > 0 ? '#dc2626' : '#16a34a' }}>
            {moneyFormatter({ amount: balance, currency_code: record.currency })}
          </span>
        );
      },
    },
    {
      title: translate('Status'),
      dataIndex: 'status',
      width: 110,
      align: 'center',
      render: (status) => {
        let color = 'default';
        if (status === 'posted') color = 'blue';
        if (status === 'pending') color = 'gold';
        if (status === 'sent') color = 'cyan';
        return <Tag color={color}>{(status || 'draft').toUpperCase()}</Tag>;
      },
    },
    {
      title: translate('Payment'),
      dataIndex: 'paymentStatus',
      width: 150,
      align: 'center',
      render: (paymentStatus, record) => {
        const balance = Math.max(0, Number(record.total || 0) - Number(record.credit || 0));
        if (paymentStatus === 'paid' || balance === 0) {
          return <Tag color="green" style={{ fontWeight: 600 }}>PAID</Tag>;
        }
        if (paymentStatus === 'partially' || (Number(record.credit || 0) > 0 && balance > 0)) {
          return <Tag color="orange" style={{ fontWeight: 600 }}>PARTIALLY PAID</Tag>;
        }
        return <Tag color="red" style={{ fontWeight: 600 }}>UNPAID (PENDING)</Tag>;
      },
    },
  ];

  const Labels = {
    PANEL_TITLE: translate('invoice'),
    DATATABLE_TITLE: translate('invoice_list'),
    ADD_NEW_ENTITY: translate('add_new_invoice'),
    ENTITY_NAME: translate('invoice'),

    RECORD_ENTITY: translate('record_payment'),
  };

  const configPage = {
    entity,
    ...Labels,
  };
  const config = {
    ...configPage,
    dataTableColumns,
    searchConfig,
    deleteModalLabels,
  };

  return <InvoiceDataTableModule config={config} />;
}
