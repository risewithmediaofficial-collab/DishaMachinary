import { useState, useEffect } from 'react';
import { Button, Tag, Tooltip } from 'antd';
import {
  EditOutlined,
  FilePdfOutlined,
  MailOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExportOutlined,
  CalendarOutlined,
  WalletOutlined,
  BankOutlined,
  CreditCardOutlined,
  ThunderboltOutlined,
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  AuditOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { erp } from '@/redux/erp/actions';
import useLanguage from '@/locale/useLanguage';
import { selectCurrentItem } from '@/redux/erp/selectors';
import { DOWNLOAD_BASE_URL } from '@/config/serverApiConfig';
import { useMoney } from '@/settings';
import useMail from '@/hooks/useMail';
import { numberToWords } from '@/components/BillTemplate';

export default function ReadItem({ config, selectedItem }) {
  const translate = useLanguage();
  const { entity, ENTITY_NAME } = config;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { moneyFormatter } = useMoney();
  const { send, isLoading: mailInProgress } = useMail({ entity });

  const { result: currentResult } = useSelector(selectCurrentItem);

  const payment = currentResult || selectedItem || {};
  const client = payment.client || {};
  const invoice = payment.invoice || null;
  const isInvoiceObject = Boolean(invoice && typeof invoice === 'object' && invoice.number !== undefined);
  const invoiceRemaining = isInvoiceObject
    ? Math.max(0, (invoice.total || 0) - (invoice.credit || 0))
    : 0;

  const getMethodInfo = (method) => {
    switch (method?.toLowerCase()) {
      case 'upi':
        return {
          label: 'UPI Instant Transfer',
          icon: <ThunderboltOutlined style={{ color: '#0284c7' }} />,
          badgeBg: '#f0f9ff',
          badgeBorder: '#bae6fd',
          badgeColor: '#0369a1',
        };
      case 'bank_transfer':
        return {
          label: 'Bank Transfer (NEFT/RTGS)',
          icon: <BankOutlined style={{ color: '#7c3aed' }} />,
          badgeBg: '#f5f3ff',
          badgeBorder: '#ddd6fe',
          badgeColor: '#6d28d9',
        };
      case 'card':
        return {
          label: 'Card Payment (POS)',
          icon: <CreditCardOutlined style={{ color: '#ea580c' }} />,
          badgeBg: '#fff7ed',
          badgeBorder: '#fed7aa',
          badgeColor: '#c2410c',
        };
      case 'credit':
        return {
          label: 'Customer Account Credit',
          icon: <FileTextOutlined style={{ color: '#d97706' }} />,
          badgeBg: '#fffbeb',
          badgeBorder: '#fde68a',
          badgeColor: '#b45309',
        };
      case 'cash':
      default:
        return {
          label: 'Cash Payment',
          icon: <WalletOutlined style={{ color: '#16a34a' }} />,
          badgeBg: '#f0fdf4',
          badgeBorder: '#bbf7d0',
          badgeColor: '#15803d',
        };
    }
  };

  const methodInfo = getMethodInfo(payment.method);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 20px 48px' }}>
      {/* ===================== TOP CONTROLS & BREADCRUMB ===================== */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
          marginBottom: 20,
          background: '#ffffff',
          padding: '16px 20px',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/payment')}
            style={{
              borderRadius: 8,
              fontWeight: 600,
              border: '1px solid #cbd5e1',
              color: '#334155',
            }}
          >
            All Payments
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f172a' }}>
                Payment Receipt #{payment.number}/{payment.year || ''}
              </h1>
              <Tag
                color={payment.status === 'posted' ? 'success' : 'error'}
                style={{
                  borderRadius: 10,
                  fontWeight: 700,
                  padding: '2px 10px',
                  textTransform: 'uppercase',
                }}
              >
                {payment.status === 'posted' ? '● POSTED & SETTLED' : '● REVERSED'}
              </Tag>
            </div>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Official payment collection receipt & settlement voucher
            </span>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            icon={<FilePdfOutlined />}
            onClick={() =>
              window.open(`${DOWNLOAD_BASE_URL}${entity}/${entity}-${payment._id}.pdf`, '_blank')
            }
            style={{ borderRadius: 8, fontWeight: 600, border: '1px solid #cbd5e1' }}
          >
            Download PDF
          </Button>
          <Button
            loading={mailInProgress}
            icon={<MailOutlined />}
            onClick={() => send(payment._id)}
            style={{ borderRadius: 8, fontWeight: 600, border: '1px solid #cbd5e1' }}
          >
            Send by Email
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              dispatch(erp.currentAction({ actionType: 'update', data: payment }));
              navigate(`/${entity.toLowerCase()}/update/${payment._id}`);
            }}
            style={{
              borderRadius: 8,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              border: 'none',
              boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)',
            }}
          >
            Edit Payment
          </Button>
        </div>
      </div>

      {/* ===================== HERO PAYMENT BANNER ===================== */}
      <div
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: 20,
          border: '1px solid #e2e8f0',
          padding: '24px 28px',
          marginBottom: 20,
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 20,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                background: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
              }}
            >
              <CheckCircleOutlined />
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                color: '#16a34a',
              }}
            >
              PAYMENT COLLECTED & RECORDED
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 36,
                fontWeight: 900,
                color: '#0f172a',
                letterSpacing: '-0.02em',
              }}
            >
              {moneyFormatter({ amount: payment.amount || 0, currency_code: payment.currency })}
            </span>
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: '#15803d',
                background: '#dcfce7',
                padding: '3px 10px',
                borderRadius: 8,
              }}
            >
              RECEIPT #{payment.number}/{payment.year || ''}
            </span>
          </div>

          <div style={{ fontSize: 13, color: '#64748b', fontStyle: 'italic', marginTop: 4 }}>
            {numberToWords(payment.amount || 0)}
          </div>
        </div>

        {/* QUICK PILL SUMMARY */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {/* METHOD BADGE */}
          <div
            style={{
              background: methodInfo.badgeBg,
              border: `1px solid ${methodInfo.badgeBorder}`,
              color: methodInfo.badgeColor,
              padding: '10px 14px',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {methodInfo.icon}
            {methodInfo.label}
          </div>

          {/* DATE BADGE */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              padding: '10px 14px',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#334155',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            <CalendarOutlined style={{ color: '#2563eb' }} />
            {dayjs(payment.date || payment.created).format('DD MMM YYYY, hh:mm A')}
          </div>
        </div>
      </div>

      {/* ===================== BENTO GRID SECTION: 2 COLUMNS ===================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: 20,
          marginBottom: 20,
        }}
      >
        {/* COLUMN 1: CUSTOMER & PAYER DETAILS (Span 7) */}
        <div
          style={{
            gridColumn: 'span 12',
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #e2e8f0',
            padding: 24,
            boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
          className="payment-col-left"
        >
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  color: '#2563eb',
                }}
              >
                CUSTOMER & PAYER INFORMATION
              </span>
              <Tag color="blue" style={{ borderRadius: 8, fontWeight: 700 }}>
                Payer
              </Tag>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 800,
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                  flexShrink: 0,
                }}
              >
                {client.name ? client.name.charAt(0).toUpperCase() : <UserOutlined />}
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                  {client.name || 'Walk-in Customer'}
                </div>
                {client.businessName && (
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                    {client.businessName}
                  </div>
                )}
              </div>
            </div>

            {/* DETAILS LIST */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {client.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#64748b',
                      flexShrink: 0,
                    }}
                  >
                    <PhoneOutlined />
                  </div>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Phone:</span>
                  <strong style={{ color: '#0f172a' }}>{client.phone}</strong>
                </div>
              )}

              {client.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#64748b',
                      flexShrink: 0,
                    }}
                  >
                    <MailOutlined />
                  </div>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Email:</span>
                  <strong style={{ color: '#0f172a', wordBreak: 'break-all' }}>{client.email}</strong>
                </div>
              )}

              {client.address && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#64748b',
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <EnvironmentOutlined />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Address: </span>
                    <span
                      style={{
                        color: '#0f172a',
                        fontWeight: 600,
                        lineHeight: 1.4,
                        wordBreak: 'break-word',
                      }}
                    >
                      {client.address}
                    </span>
                  </div>
                </div>
              )}

              {client.gstin && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#64748b',
                      flexShrink: 0,
                    }}
                  >
                    <AuditOutlined />
                  </div>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>GSTIN:</span>
                  <strong style={{ color: '#0f172a' }}>{client.gstin}</strong>
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              marginTop: 20,
              paddingTop: 14,
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Verified Ledger Record</span>
            <Button
              type="link"
              onClick={() => navigate('/customer')}
              style={{ padding: 0, fontSize: 12, fontWeight: 700, color: '#2563eb' }}
            >
              Customer Profile →
            </Button>
          </div>
        </div>

        {/* COLUMN 2: SETTLEMENT & INVOICE DETAILS (Span 5) */}
        <div
          style={{
            gridColumn: 'span 12',
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #e2e8f0',
            padding: 24,
            boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
          className="payment-col-right"
        >
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  color: '#8b5cf6',
                }}
              >
                LINKED INVOICE & SETTLEMENT
              </span>
              <Tag color="purple" style={{ borderRadius: 8, fontWeight: 700 }}>
                Settlement
              </Tag>
            </div>

            {isInvoiceObject ? (
              <div>
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 14,
                    padding: '16px',
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                        Linked Invoice
                      </span>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
                        #{invoice.number}/{invoice.year || ''}
                      </div>
                    </div>
                    <Tag
                      color={
                        invoice.paymentStatus === 'paid'
                          ? 'green'
                          : invoice.paymentStatus === 'partially'
                          ? 'orange'
                          : 'red'
                      }
                      style={{ borderRadius: 8, fontWeight: 700, textTransform: 'uppercase' }}
                    >
                      {invoice.paymentStatus || 'UNPAID'}
                    </Tag>
                  </div>

                  {invoice.date && (
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>
                      Billed on {dayjs(invoice.date).format('DD MMM YYYY')}
                    </div>
                  )}

                  {/* PROGRESS BAR */}
                  <div style={{ marginBottom: 6 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 11,
                        color: '#64748b',
                        marginBottom: 4,
                      }}
                    >
                      <span>Settlement Coverage</span>
                      <strong style={{ color: '#0f172a' }}>
                        {invoice.total > 0
                          ? Math.min(
                              100,
                              Math.round(((invoice.credit || 0) / invoice.total) * 100)
                            )
                          : 100}
                        %
                      </strong>
                    </div>
                    <div
                      style={{
                        height: 6,
                        borderRadius: 3,
                        background: '#e2e8f0',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${
                            invoice.total > 0
                              ? Math.min(
                                  100,
                                  Math.round(((invoice.credit || 0) / invoice.total) * 100)
                                )
                              : 100
                          }%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                          borderRadius: 3,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* BREAKDOWN ITEMS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Invoice Grand Total:</span>
                    <strong style={{ color: '#0f172a' }}>
                      {moneyFormatter({
                        amount: invoice.total || 0,
                        currency_code: payment.currency,
                      })}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>This Payment Amount:</span>
                    <strong style={{ color: '#16a34a' }}>
                      +{moneyFormatter({
                        amount: payment.amount || 0,
                        currency_code: payment.currency,
                      })}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>
                      Total Collected on Bill:
                    </span>
                    <strong style={{ color: '#0f172a' }}>
                      {moneyFormatter({
                        amount: invoice.credit || 0,
                        currency_code: payment.currency,
                      })}
                    </strong>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 12.5,
                      paddingTop: 8,
                      borderTop: '1px dashed #e2e8f0',
                    }}
                  >
                    <span style={{ color: '#64748b', fontWeight: 700 }}>Remaining Due on Bill:</span>
                    <strong
                      style={{
                        color: invoiceRemaining > 0 ? '#ea580c' : '#16a34a',
                        fontSize: 13.5,
                      }}
                    >
                      {invoiceRemaining > 0
                        ? moneyFormatter({
                            amount: invoiceRemaining,
                            currency_code: payment.currency,
                          })
                        : 'Fully Settled (₹0.00)'}
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  padding: '24px 16px',
                  textAlign: 'center',
                }}
              >
                <SafetyCertificateOutlined
                  style={{ fontSize: 32, color: '#10b981', marginBottom: 10 }}
                />
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>
                  Direct Customer Credit / Advance
                </div>
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#64748b' }}>
                  This payment receipt was recorded as direct credit to the customer account or advance payment.
                </p>
              </div>
            )}
          </div>

          <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
            {isInvoiceObject ? (
              <Button
                type="primary"
                ghost
                icon={<ExportOutlined />}
                onClick={() => navigate(`/invoice/read/${invoice._id}`)}
                style={{ width: '100%', borderRadius: 10, fontWeight: 700, height: 38 }}
              >
                Open Full Bill #{invoice.number}/{invoice.year || ''}
              </Button>
            ) : (
              <Button
                onClick={() => navigate('/invoice')}
                style={{ width: '100%', borderRadius: 10, fontWeight: 600, height: 38 }}
              >
                View All Invoices
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ===================== SECTION 3: TRANSACTION AUDIT & LEDGER METADATA ===================== */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          border: '1px solid #e2e8f0',
          padding: '20px 24px',
          boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <span
              style={{
                fontSize: 11,
                color: '#94a3b8',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              Reference / UTR
            </span>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
              {payment.ref || 'Direct Settlement'}
            </div>
          </div>

          <div>
            <span
              style={{
                fontSize: 11,
                color: '#94a3b8',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              Deposit Account
            </span>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
              {payment.account || 'Main Cash Account'}
            </div>
          </div>

          {payment.createdBy?.name && (
            <div>
              <span
                style={{
                  fontSize: 11,
                  color: '#94a3b8',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                Cashier / Operator
              </span>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                {payment.createdBy.name}
              </div>
            </div>
          )}

          {payment.description && (
            <div>
              <span
                style={{
                  fontSize: 11,
                  color: '#94a3b8',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                Notes / Remarks
              </span>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginTop: 2 }}>
                {payment.description}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag color="cyan" style={{ borderRadius: 8, fontWeight: 700, padding: '3px 8px' }}>
            🔒 ERP AUDIT VERIFIED
          </Tag>
        </div>
      </div>

      <style>{`
        @media (min-width: 769px) {
          .payment-col-left {
            grid-column: span 7 !important;
          }
          .payment-col-right {
            grid-column: span 5 !important;
          }
        }
      `}</style>
    </div>
  );
}
