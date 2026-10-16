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
import { Table, Button, Modal, Space, Tooltip, Popconfirm, message } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';

import AutoCompleteAsync from '@/components/AutoCompleteAsync';
import BillViewer from '@/components/BillTemplate';
import { request } from '@/request';
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
      title: translate('Action') || 'Action',
      key: 'action',
      fixed: 'right',
      width: entity === 'invoice' ? 280 : 160,
      render: (_, record) => (
        <Space size={6} onClick={(e) => e.stopPropagation()}>
          <Tooltip title={translate('Show') || 'View Details'}>
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined style={{ color: '#2563eb' }} />}
              onClick={() => handleRead(record)}
              style={{
                borderRadius: 6,
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                fontWeight: 600,
                fontSize: 12,
                color: '#1d4ed8',
                padding: '2px 8px',
              }}
            >
              View
            </Button>
          </Tooltip>
          <Tooltip title={translate('Edit') || 'Edit Record'}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#16a34a' }} />}
              onClick={() => handleEdit(record)}
              style={{
                borderRadius: 6,
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                fontWeight: 600,
                fontSize: 12,
                color: '#15803d',
                padding: '2px 8px',
              }}
            >
              Edit
            </Button>
          </Tooltip>
          {entity === 'invoice' && Math.max(0, Number(record.total || 0) - Number(record.credit || 0)) > 0 && (
            <Tooltip title="Collect Due / Record Payment">
              <Button
                type="text"
                size="small"
                icon={<CreditCardOutlined style={{ color: '#b45309' }} />}
                onClick={() => handleRecordPayment(record)}
                style={{
                  borderRadius: 6,
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  fontWeight: 600,
                  fontSize: 12,
                  color: '#b45309',
                  padding: '2px 8px',
                }}
              >
                Pay
              </Button>
            </Tooltip>
          )}
          {entity === 'invoice' && (
            <Tooltip title="Print Bill (A4 / Thermal 80mm)">
              <Button
                type="text"
                size="small"
                icon={<PrinterOutlined style={{ color: '#0f172a' }} />}
                onClick={() => handlePrintBill(record, 'a4')}
                style={{
                  borderRadius: 6,
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  fontWeight: 600,
                  fontSize: 12,
                  color: '#0f172a',
                  padding: '2px 8px',
                }}
              >
                Print
              </Button>
            </Tooltip>
          )}
          <Tooltip title={translate('Delete') || 'Delete'}>
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined style={{ fontSize: 14 }} />}
              onClick={() => handleDelete(record)}
              style={{
                borderRadius: 6,
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                padding: '2px 6px',
              }}
            />
          </Tooltip>
        </Space>
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

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [batchDeleting, setBatchDeleting] = useState(false);

  const handleBatchDelete = async () => {
    if (!selectedRowKeys.length) return;
    setBatchDeleting(true);
    try {
      const response = await request.deleteMany({ entity, ids: selectedRowKeys });
      if (!response?.success) {
        const results = await Promise.allSettled(
          selectedRowKeys.map((id) => request.delete({ entity, id }))
        );
        const successCount = results.filter(
          (r) => r.status === 'fulfilled' && r.value?.success
        ).length;
        if (successCount > 0) {
          message.success(
            `Successfully deleted ${successCount} ${successCount === 1 ? 'record' : 'records'}`
          );
        } else {
          message.error('Failed to delete selected records');
        }
      }
      setSelectedRowKeys([]);
      dispatch(erp.list({ entity }));
    } catch (err) {
      message.error(err?.message || 'Failed to delete selected records');
    } finally {
      setBatchDeleting(false);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => {
      setSelectedRowKeys(keys);
    },
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
    ],
  };

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

      {selectedRowKeys.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            marginBottom: 14,
            borderRadius: 8,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <Space size={12}>
            <span style={{ fontWeight: 700, color: '#991b1b', fontSize: 13.5 }}>
              ✓ {selectedRowKeys.length} {selectedRowKeys.length === 1 ? 'record' : 'records'} selected
            </span>
            <Button
              size="small"
              type="link"
              onClick={() => setSelectedRowKeys([])}
              style={{ padding: 0, height: 'auto', color: '#64748b', fontSize: 12.5 }}
            >
              Clear Selection
            </Button>
          </Space>

          <Popconfirm
            title={`Delete ${selectedRowKeys.length} selected ${selectedRowKeys.length === 1 ? 'record' : 'records'}?`}
            description="Are you sure you want to delete these records? This action cannot be undone."
            onConfirm={handleBatchDelete}
            okText="Yes, Delete All"
            cancelText="Cancel"
            okButtonProps={{ danger: true, loading: batchDeleting }}
          >
            <Button
              type="primary"
              danger
              size="middle"
              icon={<DeleteOutlined />}
              loading={batchDeleting}
              style={{
                fontWeight: 700,
                borderRadius: 6,
                boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)',
              }}
            >
              Delete Selected ({selectedRowKeys.length})
            </Button>
          </Popconfirm>
        </div>
      )}

      <Table
        rowSelection={rowSelection}
        columns={dataTableColumns}
        rowKey={(item) => item._id}
        dataSource={dataSource}
        pagination={pagination}
        loading={listIsLoading}
        onChange={handelDataTableLoad}
        scroll={{ x: 'max-content', y: 'calc(100vh - 290px)' }}
        onRow={(record) => ({
          onClick: (e) => {
            if (
              e.target.closest('.ant-table-selection-column') ||
              e.target.closest('.ant-checkbox-wrapper') ||
              e.target.closest('.ant-checkbox') ||
              e.target.closest('button') ||
              e.target.closest('.ant-btn')
            ) {
              return;
            }
            handleRead(record);
          },
          style: { cursor: 'pointer' },
        })}
      />

      {entity === 'invoice' && (
        <Modal
          title={null}
          open={printModalOpen}
          onCancel={() => setPrintModalOpen(false)}
          footer={null}
          width={printFormat === 'thermal' ? 480 : 920}
          destroyOnClose
          centered
          style={{ maxWidth: 'calc(100vw - 24px)', top: 16, paddingBottom: 16 }}
          bodyStyle={{ maxHeight: '88vh', overflowY: 'auto', overflowX: 'hidden', padding: '16px' }}
        >
          {selectedInvoiceForPrint && (
            <div style={{ padding: '4px 0' }}>
              <BillViewer
                invoice={selectedInvoiceForPrint}
                entity={entity}
                defaultFormat={printFormat}
                onFormatChange={(fmt) => setPrintFormat(fmt)}
                showToolbar={true}
              />
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
