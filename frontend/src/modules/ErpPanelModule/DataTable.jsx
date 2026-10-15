import { useEffect, useState } from 'react';
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  BarcodeOutlined,
  PrinterOutlined,
  CreditCardOutlined,
  RedoOutlined,
  PlusOutlined,
  EllipsisOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { Dropdown, Table, Button, Modal } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';

import AutoCompleteAsync from '@/components/AutoCompleteAsync';
import BillViewer from '@/components/BillTemplate';
import { useSelector, useDispatch } from 'react-redux';
import useLanguage from '@/locale/useLanguage';
import { erp } from '@/redux/erp/actions';
import { selectListItems } from '@/redux/erp/selectors';
import { useErpContext } from '@/context/erp';
import { useNavigate } from 'react-router-dom';

import { DOWNLOAD_BASE_URL } from '@/config/serverApiConfig';

function AddNewItem({ config }) {
  const navigate = useNavigate();
  const { ADD_NEW_ENTITY, entity } = config;

  const handleClick = () => {
    navigate(`/${entity.toLowerCase()}/create`);
  };

  return (
    <Button onClick={handleClick} type="primary" icon={<PlusOutlined />}>
      {ADD_NEW_ENTITY}
    </Button>
  );
}

export default function DataTable({ config, extra = [] }) {
  const translate = useLanguage();
  let { entity, dataTableColumns, disableAdd = false, searchConfig } = config;

  const { DATATABLE_TITLE } = config;

  const { result: listResult, isLoading: listIsLoading } = useSelector(selectListItems);

  const { pagination, items: dataSource } = listResult;

  const { erpContextAction } = useErpContext();
  const { modal } = erpContextAction;

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState(null);
  const [printFormat, setPrintFormat] = useState('a4');

  const handlePrintBill = (record, format = 'a4') => {
    setSelectedInvoiceForPrint(record);
    setPrintFormat(format);
    setPrintModalOpen(true);
  };

  const items = [
    {
      label: translate('Show'),
      key: 'read',
      icon: <EyeOutlined />,
    },
    {
      label: translate('Edit'),
      key: 'edit',
      icon: <EditOutlined />,
    },
    ...(entity === 'invoice'
      ? [
          {
            label: 'Print A4 Bill',
            key: 'print_a4',
            icon: <PrinterOutlined />,
          },
          {
            label: 'Print Thermal (80mm)',
            key: 'print_thermal',
            icon: <BarcodeOutlined />,
          },
          {
            label: 'Download A4 Bill',
            key: 'download_a4',
            icon: <FilePdfOutlined />,
          },
          {
            label: 'Download Thermal (80mm)',
            key: 'download_thermal',
            icon: <BarcodeOutlined />,
          },
          {
            label: 'Record Payment',
            key: 'recordPayment',
            icon: <CreditCardOutlined />,
          },
        ]
      : [
          {
            label: translate('Download'),
            key: 'download',
            icon: <FilePdfOutlined />,
          },
        ]),
    ...extra,
    {
      type: 'divider',
    },

    {
      label: translate('Delete'),
      key: 'delete',
      icon: <DeleteOutlined />,
    },
  ];

  const navigate = useNavigate();

  const handleRead = (record) => {
    dispatch(erp.currentItem({ data: record }));
    navigate(`/${entity}/read/${record._id}`);
  };
  const handleEdit = (record) => {
    const data = { ...record };
    dispatch(erp.currentAction({ actionType: 'update', data }));
    navigate(`/${entity}/update/${record._id}`);
  };
  const handleDownload = (record) => {
    window.open(`${DOWNLOAD_BASE_URL}${entity}/${entity}-${record._id}.pdf`, '_blank');
  };
  const handleDownloadThermal = (record) => {
    window.open(`${DOWNLOAD_BASE_URL}${entity}/${entity}-thermal-${record._id}.pdf`, '_blank');
  };

  const handleDelete = (record) => {
    dispatch(erp.currentAction({ actionType: 'delete', data: record }));
    modal.open();
  };

  const handleRecordPayment = (record) => {
    dispatch(erp.currentItem({ data: record }));
    navigate(`/invoice/pay/${record._id}`);
  };

  dataTableColumns = [
    ...dataTableColumns,
    {
      title: '',
      key: 'action',
      width: 50,
      render: (_, record) => (
        <Dropdown
          menu={{
            items,
            onClick: ({ key }) => {
              switch (key) {
                case 'read':
                  handleRead(record);
                  break;
                case 'edit':
                  handleEdit(record);
                  break;
                case 'print_a4':
                  handlePrintBill(record, 'a4');
                  break;
                case 'print_thermal':
                  handlePrintBill(record, 'thermal');
                  break;
                case 'download':
                case 'download_a4':
                  handleDownload(record);
                  break;
                case 'download_thermal':
                  handleDownloadThermal(record);
                  break;
                case 'delete':
                  handleDelete(record);
                  break;
                case 'recordPayment':
                  handleRecordPayment(record);
                  break;
                default:
                  break;
              }
              // else if (key === '2')handleCloseTask
            },
          }}
          trigger={['click']}
        >
          <EllipsisOutlined
            style={{ cursor: 'pointer', fontSize: '24px' }}
            onClick={(e) => e.preventDefault()}
          />
        </Dropdown>
      ),
    },
  ];

  const dispatch = useDispatch();

  const handelDataTableLoad = (pagination) => {
    const options = { page: pagination.current || 1, items: pagination.pageSize || 10 };
    dispatch(erp.list({ entity, options }));
  };

  const dispatcher = () => {
    dispatch(erp.list({ entity }));
  };

  useEffect(() => {
    const controller = new AbortController();
    dispatcher();
    return () => {
      controller.abort();
    };
  }, []);

  const filterTable = (value) => {
    const options = { equal: value, filter: searchConfig?.entity };
    dispatch(erp.list({ entity, options }));
  };

  return (
    <>
      <PageHeader
        title={DATATABLE_TITLE}
        ghost={true}
        onBack={() => window.history.back()}
        backIcon={<ArrowLeftOutlined />}
        extra={[
          <AutoCompleteAsync
            key="search-auto-complete"
            entity={searchConfig?.entity}
            displayLabels={['name']}
            searchFields={'name'}
            onChange={filterTable}
            // redirectLabel={'Add New Client'}
            // withRedirect
            // urlToRedirect={'/customer'}
          />,
          <Button onClick={handelDataTableLoad} key="refresh-button" icon={<RedoOutlined />}>
            {translate('Refresh')}
          </Button>,

          !disableAdd && <AddNewItem config={config} key="add-new-item" />,
        ]}
        style={{
          padding: '20px 0px',
        }}
      ></PageHeader>

      <Table
        columns={dataTableColumns}
        rowKey={(item) => item._id}
        dataSource={dataSource}
        pagination={pagination}
        loading={listIsLoading}
        onChange={handelDataTableLoad}
        scroll={{ x: 'max-content' }}
      />

      {entity === 'invoice' && (
        <Modal
          title={null}
          open={printModalOpen}
          onCancel={() => setPrintModalOpen(false)}
          footer={null}
          width={printFormat === 'thermal' ? 520 : 920}
          destroyOnClose
          centered
          style={{ maxWidth: 'calc(100vw - 16px)', top: 12, paddingBottom: 16 }}
          bodyStyle={{ maxHeight: '86vh', overflowY: 'auto', padding: '14px' }}
        >
          {selectedInvoiceForPrint && (
            <div style={{ padding: '4px 0' }}>
              <BillViewer
                invoice={selectedInvoiceForPrint}
                entity={entity}
                defaultFormat={printFormat}
                showToolbar={true}
              />
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
