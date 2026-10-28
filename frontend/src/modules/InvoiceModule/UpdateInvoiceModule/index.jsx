import NotFound from '@/components/NotFound';
import { ErpLayout } from '@/layout';
import UpdateItem from '@/modules/ErpPanelModule/UpdateItem';
import InvoiceForm from '@/modules/InvoiceModule/Forms/InvoiceForm';
import PageLoader from '@/components/PageLoader';
import { erp } from '@/redux/erp/actions';
import { selectReadItem } from '@/redux/erp/selectors';
import { useLayoutEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { Result, Button, Space, Tag } from 'antd';
import { LockOutlined, EyeOutlined, ArrowLeftOutlined, CreditCardOutlined } from '@ant-design/icons';

export default function UpdateInvoiceModule({ config }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  useLayoutEffect(() => {
    dispatch(erp.read({ entity: config.entity, id }));
  }, [id]);

  const { result: currentResult, isSuccess, isLoading = true } = useSelector(selectReadItem);

  useLayoutEffect(() => {
    if (currentResult) {
      const data = { ...currentResult };
      dispatch(erp.currentAction({ actionType: 'update', data }));
    }
  }, [currentResult]);

  if (isLoading) {
    return (
      <ErpLayout>
        <PageLoader />
      </ErpLayout>
    );
  }

  if (!isSuccess || !currentResult) {
    return (
      <ErpLayout>
        <NotFound entity={config.entity} />
      </ErpLayout>
    );
  }

  // Check if invoice has been billed/posted/deducted - these CANNOT be edited
  const isImmutable =
    Boolean(currentResult.stockDeducted) ||
    ['posted', 'sent', 'paid', 'reversed', 'cancelled'].includes(currentResult.status) ||
    currentResult.paymentStatus === 'paid';

  if (isImmutable) {
    return (
      <ErpLayout>
        <div style={{ maxWidth: 640, margin: '40px auto', background: '#ffffff', padding: '36px 24px', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(15,23,42,0.06)' }}>
          <Result
            icon={<LockOutlined style={{ color: '#d97706', fontSize: 56 }} />}
            title={
              <span style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
                Bill Cannot Be Edited
              </span>
            }
            subTitle={
              <div style={{ marginTop: 8, color: '#64748b', fontSize: 14 }}>
                <p style={{ margin: '4px 0' }}>
                  Bill <strong>#{currentResult.number}/{currentResult.year}</strong> has already been issued and recorded in inventory/accounting.
                </p>
                <p style={{ margin: '4px 0', fontSize: 13 }}>
                  Finalized bills are legally immutable to protect inventory stock counts and GST records.
                </p>
                <div style={{ marginTop: 12 }}>
                  Status:{' '}
                  <Tag color="orange" style={{ fontWeight: 700, textTransform: 'uppercase' }}>
                    {currentResult.status || 'POSTED'}
                  </Tag>
                  Payment:{' '}
                  <Tag color={currentResult.paymentStatus === 'paid' ? 'green' : 'red'} style={{ fontWeight: 700, textTransform: 'uppercase' }}>
                    {currentResult.paymentStatus || 'UNPAID'}
                  </Tag>
                </div>
              </div>
            }
            extra={
              <Space size={12} wrap style={{ justifyContent: 'center', marginTop: 16 }}>
                <Button
                  type="primary"
                  icon={<EyeOutlined />}
                  onClick={() => navigate(`/invoice/read/${currentResult._id}`)}
                >
                  View Bill
                </Button>
                {Math.max(0, Number(currentResult.total || 0) - Number(currentResult.credit || 0)) > 0 && (
                  <Button
                    icon={<CreditCardOutlined />}
                    onClick={() => navigate(`/invoice/pay/${currentResult._id}`)}
                  >
                    Record Payment
                  </Button>
                )}
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate('/invoice')}
                >
                  Back to Invoices
                </Button>
              </Space>
            }
          />
        </div>
      </ErpLayout>
    );
  }

  return (
    <ErpLayout>
      <UpdateItem config={config} UpdateForm={InvoiceForm} />
    </ErpLayout>
  );
}
