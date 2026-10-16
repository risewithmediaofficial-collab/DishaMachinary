import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Row,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import {
  ShopOutlined,
  DollarOutlined,
  FileTextOutlined,
  RiseOutlined,
  FallOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
  PlusCircleOutlined,
  CreditCardOutlined,
  ArrowRightOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  SyncOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { request } from '@/request';
import { useMoney } from '@/settings';

const { RangePicker } = DatePicker;

export default function Dashboard() {
  const { moneyFormatter } = useMoney();
  const navigate = useNavigate();
  const [range, setRange] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activePeriod, setActivePeriod] = useState('thisMonth');

  const formatMoney = (val) => moneyFormatter({ amount: val || 0 });

  const loadSummary = async () => {
    setLoading(true);
    setError('');
    const query = range
      ? `?from=${range[0].format('YYYY-MM-DD')}&to=${range[1].format('YYYY-MM-DD')}`
      : '';
    const response = await request.get({ entity: `dashboard/summary${query}` });
    if (response?.success) {
      setSummary(response.result);
    } else {
      setError(response?.message || 'Could not load dashboard data.');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSummary();
  }, [range]);

  // Active period data for hero metric
  const currentSalesData = useMemo(() => {
    if (range && summary?.customRange) {
      return {
        label: `Custom (${range[0].format('DD/MM')} - ${range[1].format('DD/MM')})`,
        sales: summary.customRange.sales || 0,
        bills: summary.customRange.bills || 0,
        grossProfit: summary.customRange.grossProfit || 0,
        collected: summary.customRange.collected || 0,
      };
    }
    switch (activePeriod) {
      case 'today':
        return { label: 'Today', sales: summary?.today?.sales || 0, bills: summary?.today?.bills || 0, grossProfit: summary?.today?.grossProfit || 0, collected: summary?.today?.collected || 0 };
      case 'thisWeek':
        return { label: 'This Week', sales: summary?.thisWeek?.sales || 0, bills: summary?.thisWeek?.bills || 0, grossProfit: summary?.thisWeek?.grossProfit || 0, collected: summary?.thisWeek?.collected || 0 };
      case 'thisYear':
        return { label: 'This Year', sales: summary?.thisYear?.sales || 0, bills: summary?.thisYear?.bills || 0, grossProfit: summary?.thisYear?.grossProfit || 0, collected: summary?.thisYear?.collected || 0 };
      case 'thisMonth':
      default:
        return { label: 'This Month', sales: summary?.thisMonth?.sales || 0, bills: summary?.thisMonth?.bills || 0, grossProfit: summary?.thisMonth?.grossProfit || 0, collected: summary?.thisMonth?.collected || 0 };
    }
  }, [summary, activePeriod, range]);

  // Sales comparison periods for the bar chart
  const salesComparison = useMemo(() => {
    return [
      { label: 'Today', sales: summary?.today?.sales || 0, bills: summary?.today?.bills || 0 },
      { label: 'This Week', sales: summary?.thisWeek?.sales || 0, bills: summary?.thisWeek?.bills || 0 },
      { label: 'This Month', sales: summary?.thisMonth?.sales || 0, bills: summary?.thisMonth?.bills || 0 },
      { label: 'This Year', sales: summary?.thisYear?.sales || 0, bills: summary?.thisYear?.bills || 0 },
    ];
  }, [summary]);

  // Financial comparative bar chart data
  const financialFlow = useMemo(() => {
    const sales = summary?.thisMonth?.sales || 0;
    const collected = summary?.thisMonth?.collected || 0;
    const expenses = summary?.monthlyExpenses?.amount || 0;
    const profit = summary?.thisMonth?.grossProfit || 0;
    return [
      { label: 'Sales Revenue', value: sales, color: '#2563eb', gradient: ['#3b82f6', '#1d4ed8'] },
      { label: 'Collections', value: collected, color: '#10b981', gradient: ['#34d399', '#059669'] },
      { label: 'Gross Profit', value: Math.max(0, profit), color: '#8b5cf6', gradient: ['#a78bfa', '#6d28d9'] },
      { label: 'Expenses', value: expenses, color: '#f43f5e', gradient: ['#fb7185', '#e11d48'] },
    ];
  }, [summary]);

  // Stock figures
  const stock = summary?.stock || {};
  const totalStockUnits = Math.max(1, (stock.onHandUnits || 0) + (stock.reservedUnits || 0) + (stock.damagedUnits || 0));
  const availablePct = Math.round((Math.max(0, stock.availableUnits || 0) / totalStockUnits) * 100);
  const reservedPct = Math.round(((stock.reservedUnits || 0) / totalStockUnits) * 100);
  const damagedPct = Math.max(0, 100 - availablePct - reservedPct);

  // Profit margin calculation
  const monthlyRevenue = summary?.thisMonth?.sales || 0;
  const monthlyProfit = summary?.thisMonth?.grossProfit || 0;
  const marginPct = monthlyRevenue > 0 ? Math.round((monthlyProfit / monthlyRevenue) * 100) : 0;

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '16px 20px 48px' }}>
      {/* ===================== TOP HEADER & CONTROLS ===================== */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: 20,
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
          color: '#ffffff',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: 18,
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
              }}
            >
              <AppstoreOutlined />
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Executive Dashboard
            </h1>
            <Tag color="blue" style={{ fontWeight: 700, borderRadius: 12, marginLeft: 4 }}>
              LIVE ERP
            </Tag>
          </div>
          <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: 13 }}>
            Real-time business performance, sales velocity, collections, and warehouse analytics
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <RangePicker
            value={range}
            onChange={(val) => setRange(val)}
            disabledDate={(date) => date && date.isAfter(dayjs(), 'day')}
            placeholder={['Start date', 'End date']}
            style={{ borderRadius: 10, height: 40, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#ffffff' }}
          />

          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={() => navigate('/pos')}
            style={{
              height: 40,
              borderRadius: 10,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              border: 'none',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
            }}
          >
            Open POS Billing
          </Button>

          <Button
            icon={<FileTextOutlined />}
            onClick={() => navigate('/invoice')}
            style={{
              height: 40,
              borderRadius: 10,
              fontWeight: 600,
              background: 'rgba(255,255,255,0.1)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            All Bills
          </Button>

          <Tooltip title="Refresh Dashboard">
            <Button
              icon={<SyncOutlined spin={loading} />}
              onClick={loadSummary}
              style={{
                height: 40,
                width: 40,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
          </Tooltip>
        </div>
      </div>

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 20, borderRadius: 12 }} />}

      {/* ===================== BENTO GRID SECTION 1: PRIMARY METRICS & GRAPHS ===================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: 20,
          marginBottom: 20,
        }}
      >
        {/* BENTO CARD 1: HERO SALES VELOCITY & DATA VISUALIZATION (Span 7) */}
        <div
          style={{
            gridColumn: 'span 12',
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #e2e8f0',
            padding: 24,
            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
          className="bento-hero-span"
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, color: '#3b82f6' }}>
                  REVENUE & SALES VELOCITY
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4 }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                    {formatMoney(currentSalesData.sales)}
                  </span>
                  <Tag color="blue" style={{ borderRadius: 12, fontWeight: 700, padding: '2px 8px' }}>
                    {currentSalesData.bills} {currentSalesData.bills === 1 ? 'bill' : 'bills'}
                  </Tag>
                </div>
              </div>

              {/* PERIOD SWITCHER PILLS */}
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  background: '#f1f5f9',
                  padding: 4,
                  borderRadius: 12,
                }}
              >
                {[
                  { key: 'today', label: 'Today' },
                  { key: 'thisWeek', label: 'Week' },
                  { key: 'thisMonth', label: 'Month' },
                  { key: 'thisYear', label: 'Year' },
                ].map((p) => {
                  const isSelected = !range && activePeriod === p.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setActivePeriod(p.key)}
                      style={{
                        border: 'none',
                        background: isSelected ? '#ffffff' : 'transparent',
                        color: isSelected ? '#1d4ed8' : '#64748b',
                        fontWeight: isSelected ? 800 : 600,
                        fontSize: 12,
                        padding: '6px 14px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SVG SALES BAR VISUALIZATION GRAPH */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 12 }}>
                Period Sales Volume Comparison
              </div>
              <SalesBarChart data={salesComparison} formatter={formatMoney} activeKey={activePeriod} />
            </div>
          </div>

          <div
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', gap: 20 }}>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Avg. Ticket Value</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                  {currentSalesData.bills > 0
                    ? formatMoney(currentSalesData.sales / currentSalesData.bills)
                    : formatMoney(0)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Collected In Period</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#16a34a' }}>
                  {formatMoney(currentSalesData.collected)}
                </div>
              </div>
            </div>

            <Link to="/invoice" style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 4 }}>
              Explore Invoice Ledger <ArrowRightOutlined style={{ fontSize: 10 }} />
            </Link>
          </div>
        </div>

        {/* BENTO CARD 2: PROFITABILITY & MARGIN GAUGE (Span 5) */}
        <div
          style={{
            gridColumn: 'span 12',
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #e2e8f0',
            padding: 24,
            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
          className="bento-profit-span"
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, color: '#10b981' }}>
                GROSS PROFIT & MARGIN
              </span>
              <Tag color="green" style={{ borderRadius: 10, fontWeight: 700 }}>
                This Month
              </Tag>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 10 }}>
              {/* CIRCULAR SVG PROGRESS GAUGE */}
              <ProfitMarginGauge percentage={marginPct} />

              <div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Estimated Gross Profit</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', marginTop: 2 }}>
                  {formatMoney(monthlyProfit)}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                  Based on machine cost snapshots at billing
                </div>
              </div>
            </div>

            {/* BREAKDOWN BARS */}
            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: '#64748b' }}>Revenue Net:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatMoney(monthlyRevenue)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: '#64748b' }}>Cost of Goods (COGS):</span>
                <span style={{ fontWeight: 700, color: '#ea580c' }}>
                  {formatMoney(Math.max(0, monthlyRevenue - monthlyProfit))}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#64748b' }}>Estimated Margin:</span>
                <span style={{ fontWeight: 800, color: '#10b981' }}>{marginPct}%</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Real-time Margin Tracking</span>
            <Tag color={marginPct >= 20 ? 'success' : 'warning'} style={{ borderRadius: 8, fontWeight: 700 }}>
              {marginPct >= 20 ? 'Healthy Margin' : 'Normal'}
            </Tag>
          </div>
        </div>
      </div>

      {/* ===================== BENTO GRID SECTION 2: OPERATIONS & FINANCIAL PULSE ===================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: 20,
          marginBottom: 20,
        }}
      >
        {/* CARD 3: CASH COLLECTIONS (Span 4) */}
        <div
          style={{
            gridColumn: 'span 12',
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #e2e8f0',
            padding: 22,
            boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
          className="bento-col-4"
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                  <WalletOutlined />
                </div>
                <span style={{ fontWeight: 800, fontSize: 13, color: '#1e293b' }}>CASH COLLECTIONS</span>
              </div>
              <Tag color="green" style={{ borderRadius: 10, fontWeight: 700 }}>Month</Tag>
            </div>

            <div style={{ marginTop: 14 }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: '#0f172a' }}>
                {formatMoney(summary?.thisMonth?.collected)}
              </span>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Today: <strong style={{ color: '#16a34a' }}>{formatMoney(summary?.today?.collected)}</strong> ({summary?.today?.receipts || 0} receipts)
              </div>
            </div>

            {/* MINI SVG SPARKLINE */}
            <div style={{ marginTop: 16 }}>
              <MiniAreaSparkline color="#10b981" />
            </div>
          </div>

          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
            <Link to="/payment" style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>
              View Payments & Receipts →
            </Link>
          </div>
        </div>

        {/* CARD 4: CUSTOMER OUTSTANDING (Span 4) */}
        <div
          style={{
            gridColumn: 'span 12',
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #e2e8f0',
            padding: 22,
            boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
          className="bento-col-4"
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                  <WarningOutlined />
                </div>
                <span style={{ fontWeight: 800, fontSize: 13, color: '#1e293b' }}>OUTSTANDING DUE</span>
              </div>
              <Tag color={Number(summary?.customerOutstanding || 0) > 0 ? 'orange' : 'default'} style={{ borderRadius: 10, fontWeight: 700 }}>
                Receivables
              </Tag>
            </div>

            <div style={{ marginTop: 14 }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: Number(summary?.customerOutstanding || 0) > 0 ? '#ea580c' : '#0f172a' }}>
                {formatMoney(summary?.customerOutstanding)}
              </span>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Unpaid customer credit balances
              </div>
            </div>

            {/* MINI PROGRESS / HEALTH BAR */}
            <div style={{ marginTop: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                <span>Payment Recovery Status</span>
                <span style={{ fontWeight: 700 }}>
                  {monthlyRevenue > 0
                    ? `${Math.min(100, Math.round(((summary?.thisMonth?.collected || 0) / monthlyRevenue) * 100))}%`
                    : '100%'}
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: '#f1f5f9', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${monthlyRevenue > 0 ? Math.min(100, Math.round(((summary?.thisMonth?.collected || 0) / monthlyRevenue) * 100)) : 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)',
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
            <Link to="/customer" style={{ fontSize: 12, fontWeight: 700, color: '#ea580c' }}>
              Customer Ledger →
            </Link>
          </div>
        </div>

        {/* CARD 5: MONTHLY OPERATIONAL EXPENSES (Span 4) */}
        <div
          style={{
            gridColumn: 'span 12',
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #e2e8f0',
            padding: 22,
            boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
          className="bento-col-4"
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fff1f2', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                  <FallOutlined />
                </div>
                <span style={{ fontWeight: 800, fontSize: 13, color: '#1e293b' }}>MONTHLY EXPENSES</span>
              </div>
              <Tag color="magenta" style={{ borderRadius: 10, fontWeight: 700 }}>
                {summary?.monthlyExpenses?.count || 0} Entries
              </Tag>
            </div>

            <div style={{ marginTop: 14 }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: '#e11d48' }}>
                {formatMoney(summary?.monthlyExpenses?.amount)}
              </span>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Operational outflows recorded this month
              </div>
            </div>

            {/* EXPENSE TO REVENUE RATIO */}
            <div style={{ marginTop: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                <span>Expense / Revenue Ratio</span>
                <span style={{ fontWeight: 700, color: '#e11d48' }}>
                  {monthlyRevenue > 0
                    ? `${Math.round(((summary?.monthlyExpenses?.amount || 0) / monthlyRevenue) * 100)}%`
                    : '0%'}
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: '#f1f5f9', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${monthlyRevenue > 0 ? Math.min(100, Math.round(((summary?.monthlyExpenses?.amount || 0) / monthlyRevenue) * 100)) : 0}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #fb7185 0%, #e11d48 100%)',
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
            <Link to="/expense" style={{ fontSize: 12, fontWeight: 700, color: '#e11d48' }}>
              Manage Expenses →
            </Link>
          </div>
        </div>
      </div>

      {/* ===================== BENTO GRID SECTION 3: WAREHOUSE & STOCK ANALYTICS ===================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: 20,
          marginBottom: 20,
        }}
      >
        {/* CARD 6: WAREHOUSE INVENTORY HEALTH (Span 7) */}
        <div
          style={{
            gridColumn: 'span 12',
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #e2e8f0',
            padding: 24,
            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
          }}
          className="bento-hero-span"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, color: '#0284c7' }}>
                WAREHOUSE STOCK AUDIT & VALUATION
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: '#0f172a' }}>
                  {formatMoney(stock.inventoryValue)}
                </span>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Total Asset Value (Cost)</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <Tag color={stock.outOfStock > 0 ? 'red' : 'default'} style={{ borderRadius: 10, fontWeight: 700 }}>
                {stock.outOfStock || 0} Out of Stock
              </Tag>
              <Tag color={stock.lowStock > 0 ? 'orange' : 'default'} style={{ borderRadius: 10, fontWeight: 700 }}>
                {stock.lowStock || 0} Low Stock
              </Tag>
            </div>
          </div>

          {/* MULTI-SEGMENT STACKED PROGRESS BAR */}
          <div style={{ margin: '20px 0 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
              <span>Stock Composition ({stock.products || 0} Active Products)</span>
              <span style={{ color: '#0284c7' }}>{(stock.availableUnits || 0).toLocaleString('en-IN')} Units Available</span>
            </div>

            <div style={{ height: 16, borderRadius: 8, background: '#f1f5f9', display: 'flex', overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}>
              <Tooltip title={`Available: ${stock.availableUnits || 0} units (${availablePct}%)`}>
                <div style={{ width: `${availablePct}%`, background: 'linear-gradient(90deg, #22c55e, #16a34a)', transition: 'width 0.4s ease' }} />
              </Tooltip>
              <Tooltip title={`Reserved: ${stock.reservedUnits || 0} units (${reservedPct}%)`}>
                <div style={{ width: `${reservedPct}%`, background: 'linear-gradient(90deg, #f59e0b, #d97706)', transition: 'width 0.4s ease' }} />
              </Tooltip>
              <Tooltip title={`Damaged: ${stock.damagedUnits || 0} units (${damagedPct}%)`}>
                <div style={{ width: `${damagedPct}%`, background: 'linear-gradient(90deg, #ef4444, #dc2626)', transition: 'width 0.4s ease' }} />
              </Tooltip>
            </div>

            {/* LEGEND TILES */}
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#16a34a' }} />
                <span style={{ fontSize: 12, color: '#475569' }}>Available: <strong>{(stock.availableUnits || 0).toLocaleString('en-IN')}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#d97706' }} />
                <span style={{ fontSize: 12, color: '#475569' }}>Reserved: <strong>{(stock.reservedUnits || 0).toLocaleString('en-IN')}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626' }} />
                <span style={{ fontSize: 12, color: '#475569' }}>Damaged: <strong>{(stock.damagedUnits || 0).toLocaleString('en-IN')}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#0284c7' }} />
                <span style={{ fontSize: 12, color: '#475569' }}>Total On Hand: <strong>{(stock.onHandUnits || 0).toLocaleString('en-IN')}</strong></span>
              </div>
            </div>
          </div>

          <div style={{ paddingTop: 16, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>Manage live quantities, adjustments & reorder triggers</span>
            <Link to="/inventory" style={{ fontSize: 12, fontWeight: 700, color: '#0284c7' }}>
              Open Inventory Management →
            </Link>
          </div>
        </div>

        {/* CARD 7: FINANCIAL CASH FLOW COMPARATIVE BAR CHART (Span 5) */}
        <div
          style={{
            gridColumn: 'span 12',
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #e2e8f0',
            padding: 24,
            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
          }}
          className="bento-profit-span"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, color: '#8b5cf6' }}>
                FINANCIAL HEALTH FLOW
              </span>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                Revenue vs Inflow vs Outflow
              </div>
            </div>
            <Tag color="purple" style={{ borderRadius: 10, fontWeight: 700 }}>This Month</Tag>
          </div>

          {/* COMPARATIVE HORIZONTAL BARS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, margin: '16px 0' }}>
            {financialFlow.map((item) => {
              const maxVal = Math.max(...financialFlow.map((f) => f.value), 1);
              const barWidth = Math.max(item.value > 0 ? (item.value / maxVal) * 100 : 0, 4);

              return (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                    <span style={{ fontWeight: 600, color: '#475569' }}>{item.label}</span>
                    <span style={{ fontWeight: 800, color: item.color }}>{formatMoney(item.value)}</span>
                  </div>
                  <div style={{ height: 10, borderRadius: 5, background: '#f1f5f9', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${barWidth}%`,
                        height: '100%',
                        borderRadius: 5,
                        background: `linear-gradient(90deg, ${item.gradient[0]} 0%, ${item.gradient[1]} 100%)`,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ paddingTop: 14, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Dynamic ratio benchmarks</span>
            <Tag color="blue" style={{ borderRadius: 8, fontWeight: 700 }}>
              Live Ledger Synced
            </Tag>
          </div>
        </div>
      </div>

      {/* ===================== BENTO GRID SECTION 4: QUICK ACTION SHORTCUT TILES ===================== */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6, color: '#64748b', marginBottom: 12 }}>
          ⚡ QUICK WORKSPACE ACTIONS
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 14,
          }}
        >
          <QuickActionTile
            title="Point of Sale"
            subtitle="Fast checkout & thermal bill"
            icon={<ThunderboltOutlined />}
            gradient={['#2563eb', '#1d4ed8']}
            onClick={() => navigate('/pos')}
          />
          <QuickActionTile
            title="Create Invoice"
            subtitle="B2B GST tax invoice"
            icon={<FileTextOutlined />}
            gradient={['#059669', '#047857']}
            onClick={() => navigate('/invoice/create')}
          />
          <QuickActionTile
            title="Machine Catalog"
            subtitle="Products & machinery specs"
            icon={<InboxOutlined />}
            gradient={['#d97706', '#b45309']}
            onClick={() => navigate('/product')}
          />
          <QuickActionTile
            title="Stock Adjustment"
            subtitle="Record stock in / out"
            icon={<SyncOutlined />}
            gradient={['#7c3aed', '#6d28d9']}
            onClick={() => navigate('/inventory')}
          />
          <QuickActionTile
            title="Customer Directory"
            subtitle="Clients & outstanding balances"
            icon={<ShopOutlined />}
            gradient={['#0f172a', '#334155']}
            onClick={() => navigate('/customer')}
          />
        </div>
      </div>

      {/* ===================== BENTO GRID SECTION 5: LIVE TRANSACTION TABLES ===================== */}
      <Row gutter={[20, 20]}>
        {/* RECENT BILLS TABLE */}
        <Col xs={24} lg={12}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: 20,
              border: '1px solid #e2e8f0',
              padding: 22,
              boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                  Recent Sales Invoices
                </h3>
                <span style={{ fontSize: 12, color: '#64748b' }}>Latest bills created across all channels</span>
              </div>
              <Link to="/invoice" style={{ fontSize: 12, fontWeight: 700, color: '#2563eb' }}>
                View All Bills →
              </Link>
            </div>

            <RecentBills moneyFormatter={moneyFormatter} onRowClick={(id) => navigate(`/invoice/read/${id}`)} />
          </div>
        </Col>

        {/* RECENT PAYMENTS TABLE */}
        <Col xs={24} lg={12}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: 20,
              border: '1px solid #e2e8f0',
              padding: 22,
              boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                  Recent Payment Receipts
                </h3>
                <span style={{ fontSize: 12, color: '#64748b' }}>Incoming cash, bank & UPI receipts</span>
              </div>
              <Link to="/payment" style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>
                View Payments →
              </Link>
            </div>

            <Table
              rowKey="_id"
              loading={loading}
              dataSource={summary?.recentPayments || []}
              pagination={false}
              size="small"
              locale={{ emptyText: <Empty description="No payments recorded yet" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
              columns={[
                {
                  title: 'Date',
                  dataIndex: 'date',
                  render: (date) => (
                    <span style={{ fontSize: 12, color: '#64748b' }}>{dayjs(date).format('DD/MM/YYYY')}</span>
                  ),
                },
                {
                  title: 'Customer',
                  dataIndex: ['client', 'name'],
                  render: (text) => (
                    <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>{text || 'Walk-in Customer'}</span>
                  ),
                },
                {
                  title: 'Method',
                  dataIndex: 'method',
                  render: (method) => (
                    <Tag color="blue" style={{ textTransform: 'capitalize', fontWeight: 600, borderRadius: 8 }}>
                      {method || 'Cash'}
                    </Tag>
                  ),
                },
                {
                  title: 'Amount',
                  dataIndex: 'amount',
                  align: 'right',
                  render: (value) => (
                    <span style={{ fontWeight: 800, color: '#16a34a', fontSize: 13.5 }}>
                      {formatMoney(value)}
                    </span>
                  ),
                },
              ]}
              onRow={(record) => ({
                onClick: () => navigate(`/payment/read/${record._id}`),
                style: { cursor: 'pointer' },
              })}
            />
          </div>
        </Col>
      </Row>

      {/* INJECT BENTO GRID RESPONSIVE STYLES */}
      <style>{`
        @media (min-width: 992px) {
          .bento-hero-span {
            grid-column: span 7 !important;
          }
          .bento-profit-span {
            grid-column: span 5 !important;
          }
          .bento-col-4 {
            grid-column: span 4 !important;
          }
        }
      `}</style>
    </div>
  );
}

// ===================== DATA VISUALIZATION COMPONENTS =====================

/**
 * Modern SVG Sales Bar Chart with Tooltips & Value Labels
 */
function SalesBarChart({ data, formatter, activeKey }) {
  const maxVal = Math.max(...data.map((d) => d.sales), 1);
  const chartHeight = 160;

  return (
    <div style={{ width: '100%', height: chartHeight + 40, position: 'relative' }}>
      <svg width="100%" height={chartHeight} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="barGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="barGradActive" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>

        {/* HORIZONTAL GRID LINES */}
        <line x1="0%" y1="0%" x2="100%" y2="0%" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="0%" y1="100%" x2="100%" y2="100%" stroke="#e2e8f0" strokeWidth="1" />

        {/* BARS */}
        {data.map((item, index) => {
          const colWidthPct = 100 / data.length;
          const barWidth = 44;
          const leftPct = (index + 0.5) * colWidthPct;
          const barHeight = item.sales > 0 ? Math.max((item.sales / maxVal) * (chartHeight - 30), 8) : 4;
          const y = chartHeight - barHeight;

          return (
            <g key={item.label} className="chart-bar-group">
              {/* BAR RECT */}
              <rect
                x={`calc(${leftPct}% - ${barWidth / 2}px)`}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={8}
                fill={item.sales > 0 ? 'url(#barGrad)' : '#e2e8f0'}
                style={{
                  transition: 'height 0.4s ease, y 0.4s ease',
                  cursor: 'pointer',
                  filter: item.sales > 0 ? 'drop-shadow(0 4px 6px rgba(37,99,235,0.2))' : 'none',
                }}
              />

              {/* VALUE LABEL ON TOP */}
              {item.sales > 0 && (
                <text
                  x={`${leftPct}%`}
                  y={y - 8}
                  textAnchor="middle"
                  fill="#1e293b"
                  fontSize="11"
                  fontWeight="800"
                >
                  {formatter(item.sales)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* LABELS UNDERNEATH */}
      <div style={{ display: 'flex', width: '100%', marginTop: 8 }}>
        {data.map((item) => (
          <div key={item.label} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>{item.label}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.bills} {item.bills === 1 ? 'bill' : 'bills'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Circular SVG Profit Margin Gauge
 */
function ProfitMarginGauge({ percentage }) {
  const size = 96;
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const validPct = Math.min(Math.max(percentage || 0, 0), 100);
  const strokeDashoffset = circumference - (validPct / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#profitGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <defs>
          <linearGradient id="profitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{validPct}%</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>MARGIN</span>
      </div>
    </div>
  );
}

/**
 * Mini Wave Area Sparkline
 */
function MiniAreaSparkline({ color }) {
  return (
    <div style={{ height: 44, width: '100%', overflow: 'hidden' }}>
      <svg width="100%" height="44" viewBox="0 0 200 44" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path
          d="M0,36 Q30,10 60,25 T120,12 T170,28 T200,8 L200,44 L0,44 Z"
          fill="url(#sparklineGrad)"
        />
        <path
          d="M0,36 Q30,10 60,25 T120,12 T170,28 T200,8"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/**
 * Quick Action Bento Tile
 */
function QuickActionTile({ title, subtitle, icon, gradient, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        padding: '16px 18px',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.07)';
        e.currentTarget.style.borderColor = '#cbd5e1';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
        e.currentTarget.style.borderColor = '#e2e8f0';
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: `linear-gradient(135deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontSize: 20,
          flexShrink: 0,
          boxShadow: `0 4px 10px ${gradient[0]}40`,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 13.5, color: '#0f172a' }}>{title}</div>
        <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}

/**
 * Recent Bills Table Component
 */
function RecentBills({ moneyFormatter, onRowClick }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    request.list({ entity: 'invoice', options: { page: 1, items: 5 } }).then((response) => {
      if (!active) return;
      setRows(response?.success ? response.result : []);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  return (
    <Table
      rowKey="_id"
      loading={loading}
      dataSource={rows}
      pagination={false}
      size="small"
      locale={{ emptyText: <Empty description="No bills created yet" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
      columns={[
        {
          title: 'Bill #',
          dataIndex: 'number',
          render: (number, record) => (
            <span style={{ fontWeight: 700, color: '#2563eb', fontSize: 13 }}>
              {number}/{record.year}
            </span>
          ),
        },
        {
          title: 'Customer',
          dataIndex: ['client', 'name'],
          render: (name) => <span style={{ fontWeight: 600, color: '#0f172a' }}>{name || 'Walk-in'}</span>,
        },
        {
          title: 'Date',
          dataIndex: 'date',
          render: (date) => <span style={{ fontSize: 12, color: '#64748b' }}>{dayjs(date).format('DD/MM/YYYY')}</span>,
        },
        {
          title: 'Total',
          dataIndex: 'total',
          align: 'right',
          render: (val) => (
            <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 13.5 }}>
              {moneyFormatter({ amount: val || 0 })}
            </span>
          ),
        },
        {
          title: 'Status',
          dataIndex: 'status',
          align: 'center',
          render: (status) => {
            const color = status === 'paid' ? 'green' : status === 'partially' ? 'orange' : 'blue';
            return (
              <Tag color={color} style={{ borderRadius: 8, textTransform: 'uppercase', fontWeight: 700, fontSize: 10 }}>
                {status || 'UNPAID'}
              </Tag>
            );
          },
        },
      ]}
      onRow={(record) => ({
        onClick: () => onRowClick && onRowClick(record._id),
        style: { cursor: 'pointer' },
      })}
    />
  );
}
