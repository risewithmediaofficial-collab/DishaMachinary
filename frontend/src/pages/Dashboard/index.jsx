import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Card, Col, DatePicker, Empty, Row, Space, Statistic, Table, Typography } from 'antd';
import dayjs from 'dayjs';
import { request } from '@/request';
import { useMoney } from '@/settings';

const { RangePicker } = DatePicker;

const amount = (moneyFormatter, value) => moneyFormatter({ amount: value || 0 });

export default function Dashboard() {
  const { moneyFormatter } = useMoney();
  const [range, setRange] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      const query = range
        ? `?from=${range[0].format('YYYY-MM-DD')}&to=${range[1].format('YYYY-MM-DD')}`
        : '';
      const response = await request.get({ entity: `dashboard/summary${query}` });
      if (!active) return;
      if (response?.success) setSummary(response.result);
      else setError(response?.message || 'Could not load dashboard data.');
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, [range]);

  const periods = [
    ['Today', summary?.today],
    ['This week', summary?.thisWeek],
    ['This month', summary?.thisMonth],
    ['This year', summary?.thisYear],
  ];

  return (
    <main>
      <Row align="middle" justify="space-between" gutter={[12, 12]} style={{ marginBottom: 20 }}>
        <Col>
          <Typography.Title level={2} style={{ margin: 0 }}>Dashboard</Typography.Title>
        </Col>
        <Col>
          <Space wrap>
            <RangePicker
              value={range}
              onChange={(value) => setRange(value)}
              disabledDate={(date) => date && date.isAfter(dayjs(), 'day')}
            />
            <Button type="primary" href="/pos">Open POS</Button>
            <Button href="/invoice">All bills</Button>
          </Space>
        </Col>
      </Row>

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}

      <Typography.Title level={4}>Sales</Typography.Title>
      <Row gutter={[12, 12]}>
        {periods.map(([label, data]) => (
          <Col xs={24} sm={12} xl={6} key={label}>
            <Card loading={loading} size="small">
              <Statistic title={label} value={amount(moneyFormatter, data?.sales)} />
              <Typography.Text type="secondary">{data?.bills || 0} bills</Typography.Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Typography.Title level={4} style={{ marginTop: 28 }}>Operations</Typography.Title>
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} xl={6}><Card loading={loading} size="small"><Statistic title="Payments collected today" value={amount(moneyFormatter, summary?.today?.collected)} /><Typography.Text type="secondary">{summary?.today?.receipts || 0} receipts (separate from sales)</Typography.Text></Card></Col>
        <Col xs={24} sm={12} xl={6}><Card loading={loading} size="small"><Statistic title="Payments collected this month" value={amount(moneyFormatter, summary?.thisMonth?.collected)} /></Card></Col>
        <Col xs={24} sm={12} xl={6}><Card loading={loading} size="small"><Statistic title="Customer outstanding" value={amount(moneyFormatter, summary?.customerOutstanding)} /></Card></Col>
        <Col xs={24} sm={12} xl={6}><Card loading={loading} size="small"><Statistic title="Estimated gross profit this month" value={amount(moneyFormatter, summary?.thisMonth?.grossProfit)} /><Typography.Text type="secondary">Based on saved product cost snapshots</Typography.Text></Card></Col>
        <Col xs={24} sm={12} xl={6}><Card loading={loading} size="small"><Statistic title="Monthly expenses" value={amount(moneyFormatter, summary?.monthlyExpenses?.amount)} /><Typography.Text type="secondary">{summary?.monthlyExpenses?.count || 0} entries</Typography.Text></Card></Col>
      </Row>

      {range && (
        <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
          <Col xs={24} sm={12} xl={6}>
            <Card loading={loading} size="small">
              <Statistic
                title={`Selected period (${range[0].format('DD/MM/YYYY')} to ${range[1].format('DD/MM/YYYY')})`}
                value={amount(moneyFormatter, summary?.customRange?.sales)}
              />
              <Typography.Text type="secondary">{summary?.customRange?.bills || 0} bills</Typography.Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card loading={loading} size="small">
              <Statistic title="Collected in period" value={amount(moneyFormatter, summary?.customRange?.collected)} />
            </Card>
          </Col>
        </Row>
      )}

      <Typography.Title level={4} style={{ marginTop: 28 }}>Data analysis</Typography.Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="Sales comparison" loading={loading}>
            <AnalysisBars
              color="#1677ff"
              formatter={(value) => amount(moneyFormatter, value)}
              data={periods.map(([label, data]) => ({ label, value: data?.sales || 0 }))}
            />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title="Stock position" loading={loading}>
            <AnalysisBars
              color="#52c41a"
              formatter={(value) => `${value.toLocaleString('en-IN')} units`}
              data={[
                { label: 'On hand', value: Math.max(summary?.stock?.onHandUnits || 0, 0) },
                { label: 'Reserved', value: Math.max(summary?.stock?.reservedUnits || 0, 0) },
                { label: 'Available', value: Math.max(summary?.stock?.availableUnits || 0, 0) },
                { label: 'Damaged', value: Math.max(summary?.stock?.damagedUnits || 0, 0) },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Typography.Title level={4} style={{ marginTop: 28 }}>Inventory</Typography.Title>
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} xl={6}><Card loading={loading} size="small"><Statistic title="Available stock" value={summary?.stock?.availableUnits || 0} suffix="units" /><Typography.Text type="secondary">{summary?.stock?.onHandUnits || 0} on hand · {summary?.stock?.reservedUnits || 0} reserved · {summary?.stock?.damagedUnits || 0} damaged</Typography.Text></Card></Col>
        <Col xs={24} sm={12} xl={6}><Card loading={loading} size="small"><Statistic title="Inventory value at cost" value={amount(moneyFormatter, summary?.stock?.inventoryValue)} /></Card></Col>
        <Col xs={24} sm={12} xl={6}><Card loading={loading} size="small"><Statistic title="Tracked products" value={summary?.stock?.products || 0} /></Card></Col>
        <Col xs={24} sm={12} xl={6}><Card loading={loading} size="small"><Statistic title="Low stock items" value={summary?.stock?.lowStock || 0} /><Typography.Text type="secondary">{summary?.stock?.outOfStock || 0} out of stock</Typography.Text></Card></Col>
      </Row>

      <Row gutter={[12, 12]} style={{ marginTop: 28 }}>
        <Col xs={24} lg={12}>
          <Card title="Recent bills" extra={<Link to="/invoice">View all</Link>}>
            <RecentBills moneyFormatter={moneyFormatter} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Quick actions">
            <Space wrap>
              <Button type="primary" href="/pos">New POS bill</Button>
              <Button href="/invoice/create">Create invoice</Button>
              <Button href="/product">Products</Button>
              <Button href="/inventory">Stock movements</Button>
              <Button href="/customer">Customers</Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Recent payments" extra={<Link to="/payment">View all</Link>}>
            <Table
              rowKey="_id"
              loading={loading}
              dataSource={summary?.recentPayments || []}
              pagination={false}
              scroll={{ x: 'max-content' }}
              locale={{ emptyText: <Empty description="No payments yet" /> }}
              columns={[
                { title: 'Date', dataIndex: 'date', render: (date) => dayjs(date).format('DD/MM/YYYY') },
                { title: 'Customer', dataIndex: ['client', 'name'] },
                { title: 'Method', dataIndex: 'method' },
                { title: 'Amount', dataIndex: 'amount', render: (value) => amount(moneyFormatter, value) },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </main>
  );
}

function AnalysisBars({ data, formatter, color }) {
  const maximum = Math.max(...data.map((item) => Number(item.value) || 0), 1);
  return (
    <div role="img" aria-label="Bar chart" style={{ display: 'grid', gap: 16 }}>
      {data.map((item) => {
        const value = Number(item.value) || 0;
        const width = value > 0 ? Math.max((value / maximum) * 100, 3) : 0;
        return (
          <div key={item.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
              <Typography.Text>{item.label}</Typography.Text>
              <Typography.Text strong>{formatter(value)}</Typography.Text>
            </div>
            <div style={{ height: 14, borderRadius: 7, overflow: 'hidden', background: '#f0f0f0' }}>
              <div
                title={`${item.label}: ${formatter(value)}`}
                style={{ width: `${width}%`, height: '100%', borderRadius: 7, background: color, transition: 'width 300ms ease' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RecentBills({ moneyFormatter }) {
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
      scroll={{ x: 'max-content' }}
      locale={{ emptyText: <Empty description="No bills yet" /> }}
      columns={[
        { title: 'Bill', dataIndex: 'number', render: (number, record) => `${number}/${record.year}` },
        { title: 'Customer', dataIndex: ['client', 'name'] },
        { title: 'Date', dataIndex: 'date', render: (date) => dayjs(date).format('DD/MM/YYYY') },
        { title: 'Total', dataIndex: 'total', render: (value) => moneyFormatter({ amount: value || 0 }) },
        { title: 'Status', dataIndex: 'status' },
      ]}
    />
  );
}
