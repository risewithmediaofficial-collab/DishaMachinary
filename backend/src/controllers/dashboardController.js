const mongoose = require('mongoose');

const Invoice = mongoose.model('Invoice');
const Product = mongoose.model('Product');
const Payment = mongoose.model('Payment');
const Expense = mongoose.model('Expense');

const INDIA_OFFSET_MS = 330 * 60 * 1000;
const indiaParts = (date) => Object.fromEntries(
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: 'numeric', day: 'numeric',
  }).formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)])
);
const indiaMidnight = (year, month, day) => new Date(Date.UTC(year, month - 1, day) - INDIA_OFFSET_MS);

const paymentTotals = async (from, to) => {
  const matchStage = { removed: { $ne: true }, status: { $ne: 'reversed' } };
  if (from && to) {
    matchStage.date = { $gte: from, $lt: to };
  }
  const [result] = await Payment.aggregate([
    { $match: matchStage },
    { $group: { _id: null, collected: { $sum: { $ifNull: ['$amount', 0] } }, receipts: { $sum: 1 } } },
  ]);
  return { collected: Number((result?.collected || 0).toFixed(2)), receipts: result?.receipts || 0 };
};

const invoiceTotals = async (from, to) => {
  const matchStage = {
    removed: { $ne: true },
    status: { $nin: ['cancelled', 'reversing', 'reversed', 'refunded'] },
  };
  if (from && to) {
    matchStage.date = { $gte: from, $lt: to };
  }

  const [result] = await Invoice.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        bills: { $sum: 1 },
        sales: {
          $sum: { $ifNull: ['$total', 0] },
        },
        netRevenue: {
          $sum: {
            $subtract: [{ $ifNull: ['$subTotal', 0] }, { $ifNull: ['$discount', 0] }],
          },
        },
        taxTotal: {
          $sum: { $ifNull: ['$taxTotal', 0] },
        },
        creditTotal: {
          $sum: { $ifNull: ['$credit', 0] },
        },
        pendingTotal: {
          $sum: {
            $max: [
              0,
              {
                $subtract: [
                  { $ifNull: ['$total', 0] },
                  { $ifNull: ['$credit', 0] },
                ],
              },
            ],
          },
        },
      },
    },
  ]);

  const payments = await paymentTotals(from, to);
  const bills = result?.bills || 0;
  const sales = Number((result?.sales || 0).toFixed(2));
  const netRevenue = Number((result?.netRevenue || 0).toFixed(2));
  const taxTotal = Number((result?.taxTotal || 0).toFixed(2));
  const pendingAmount = Number((result?.pendingTotal || 0).toFixed(2));

  // Realized Net Sales: Exclude GST and exclude pending credit amount
  const paidRatio = sales > 0 ? Math.max(0, Math.min(1, (sales - pendingAmount) / sales)) : 1;
  const realizedNet = Number((netRevenue * paidRatio).toFixed(2));

  // Today sales as profit margin (excluding GST and pending amount)
  const grossProfit = realizedNet;
  const margin = netRevenue > 0 ? Number(((realizedNet / netRevenue) * 100).toFixed(0)) : (sales > 0 ? 0 : 100);

  return {
    bills,
    sales,
    netRevenue,
    taxTotal,
    pendingAmount,
    realizedNet,
    grossProfit,
    margin,
    ...payments,
  };
};

const parseDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const [year, month, day] = value.split('-').map(Number);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    return null;
  }
  return indiaMidnight(year, month, day);
};

const summary = async (req, res) => {
  const now = new Date();
  const parts = indiaParts(now);
  const today = indiaMidnight(parts.year, parts.month, parts.day);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const weekday = (new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay() + 6) % 7;
  const week = new Date(today.getTime() - weekday * 24 * 60 * 60 * 1000);
  const month = indiaMidnight(parts.year, parts.month, 1);
  const year = indiaMidnight(parts.year, 1, 1);
  const nextWeek = new Date(week.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = indiaMidnight(parts.year, parts.month + 1, 1);
  const nextYear = indiaMidnight(parts.year + 1, 1, 1);

  const [todayTotals, weekTotals, monthTotals, yearTotals, allTimeTotals, stock, outstanding, recentPayments, monthlyExpenses] = await Promise.all([
    invoiceTotals(today, tomorrow),
    invoiceTotals(week, nextWeek),
    invoiceTotals(month, nextMonth),
    invoiceTotals(year, nextYear),
    invoiceTotals(null, null), // All-time totals without date boundaries
    Product.aggregate([
      { $match: { removed: { $ne: true }, enabled: { $ne: false }, trackInventory: true } },
      {
        $group: {
          _id: null,
          products: { $sum: 1 },
          availableUnits: { $sum: { $ifNull: ['$stockQuantity', 0] } },
          reservedUnits: { $sum: { $ifNull: ['$reservedQuantity', 0] } },
          damagedUnits: { $sum: { $ifNull: ['$damagedQuantity', 0] } },
          inventoryValue: {
            $sum: {
              $multiply: [{ $ifNull: ['$stockQuantity', 0] }, { $ifNull: ['$purchasePrice', 0] }],
            },
          },
          lowStock: {
            $sum: {
              $cond: [
                { $lte: ['$stockQuantity', '$reorderLevel'] },
                1,
                0,
              ],
            },
          },
          outOfStock: { $sum: { $cond: [{ $lte: ['$stockQuantity', 0] }, 1, 0] } },
        },
      },
    ]),
    Invoice.aggregate([
      { $match: { removed: { $ne: true }, status: { $nin: ['cancelled', 'reversed', 'refunded'] } } },
      { $group: { _id: null, amount: { $sum: { $subtract: [{ $ifNull: ['$total', 0] }, { $ifNull: ['$credit', 0] }] } } } },
    ]),
    Payment.find({ removed: { $ne: true }, status: { $ne: 'reversed' } })
      .sort({ date: -1, created: -1 })
      .limit(5)
      .select('number client invoice date amount method ref')
      .lean(),
    Expense.aggregate([
      { $match: { removed: { $ne: true }, date: { $gte: month, $lt: nextMonth } } },
      { $group: { _id: null, amount: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
  ]);

  let customRange = null;
  if (req.query.from || req.query.to) {
    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);
    if (!from || !to || from > to) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Provide a valid date range using YYYY-MM-DD for from and to.',
      });
    }
    const exclusiveTo = new Date(to.getTime() + 24 * 60 * 60 * 1000);
    customRange = { from: req.query.from, to: req.query.to, ...(await invoiceTotals(from, exclusiveTo)) };
  }

  return res.status(200).json({
    success: true,
    result: {
      today: todayTotals,
      thisWeek: weekTotals,
      thisMonth: monthTotals,
      thisYear: yearTotals,
      allTime: allTimeTotals,
      customRange,
      stock: {
        products: stock[0]?.products || 0,
        onHandUnits: stock[0]?.availableUnits || 0,
        reservedUnits: stock[0]?.reservedUnits || 0,
        availableUnits: (stock[0]?.availableUnits || 0) - (stock[0]?.reservedUnits || 0),
        damagedUnits: stock[0]?.damagedUnits || 0,
        inventoryValue: Number((stock[0]?.inventoryValue || 0).toFixed(2)),
        lowStock: stock[0]?.lowStock || 0,
        outOfStock: stock[0]?.outOfStock || 0,
      },
      customerOutstanding: Number((outstanding[0]?.amount || 0).toFixed(2)),
      recentPayments,
      monthlyExpenses: {
        amount: Number((monthlyExpenses[0]?.amount || 0).toFixed(2)),
        count: monthlyExpenses[0]?.count || 0,
      },
      asOf: now,
    },
  });
};

module.exports = { summary };
