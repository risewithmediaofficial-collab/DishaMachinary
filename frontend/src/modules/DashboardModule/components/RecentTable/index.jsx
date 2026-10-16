import { Dropdown, Table } from 'antd';

import { request } from '@/request';
import useFetch from '@/hooks/useFetch';

import { EllipsisOutlined, EyeOutlined, EditOutlined, FilePdfOutlined, BarcodeOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { erp } from '@/redux/erp/actions';
import useLanguage from '@/locale/useLanguage';
import { useNavigate } from 'react-router-dom';
import { DOWNLOAD_BASE_URL } from '@/config/serverApiConfig';

export default function RecentTable({ ...props }) {
  const translate = useLanguage();
  let { entity, dataTableColumns } = props;

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
            label: 'Download A4 Bill',
            key: 'download_a4',
            icon: <FilePdfOutlined />,
          },
          {
            label: 'Download Thermal (80mm)',
            key: 'download_thermal',
            icon: <BarcodeOutlined />,
          },
        ]
      : [
          {
            label: translate('Download'),
            key: 'download',
            icon: <FilePdfOutlined />,
          },
        ]),
  ];

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleRead = (record) => {
    dispatch(erp.currentItem({ data: record }));
    navigate(`/${entity}/read/${record._id}`);
  };
  const handleEdit = (record) => {
    dispatch(erp.currentAction({ actionType: 'update', data: record }));
    navigate(`/${entity}/update/${record._id}`);
  };
  const handleDownload = (record) => {
    window.open(`${DOWNLOAD_BASE_URL}${entity}/${entity}-${record._id}.pdf`, '_blank');
  };
  const handleDownloadThermal = (record) => {
    window.open(`${DOWNLOAD_BASE_URL}${entity}/${entity}-thermal-${record._id}.pdf`, '_blank');
  };

  dataTableColumns = [
    ...dataTableColumns,
    {
      title: 'Action',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => handleRead(record)}
            style={{
              padding: '3px 8px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 6,
              background: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <EyeOutlined style={{ fontSize: 12 }} /> View
          </button>
          <button
            type="button"
            onClick={() => handleEdit(record)}
            style={{
              padding: '3px 8px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 6,
              background: '#f0fdf4',
              color: '#15803d',
              border: '1px solid #bbf7d0',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <EditOutlined style={{ fontSize: 12 }} /> Edit
          </button>
        </div>
      ),
    },
  ];

  const asyncList = () => {
    return request.list({ entity });
  };
  const { result, isLoading, isSuccess } = useFetch(asyncList);
  const firstFiveItems = () => {
    if (isSuccess && result) return result.slice(0, 5);
    return [];
  };

  return (
    <Table
      columns={dataTableColumns}
      rowKey={(item) => item._id}
      dataSource={isSuccess && firstFiveItems()}
      pagination={false}
      loading={isLoading}
      onRow={(record) => ({
        onClick: () => handleRead(record),
        style: { cursor: 'pointer' },
      })}
    />
  );
}

