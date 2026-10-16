import dayjs from 'dayjs';

export function numberToWords(num) {
  if (typeof num !== 'number' || isNaN(num) || num <= 0) return 'Zero Rupees Only';
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ',
    'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen ',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    let str = '';
    if (n > 19) {
      str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
    } else {
      str += a[n];
    }
    return str;
  };

  let integerPart = Math.floor(num);
  let decimalPart = Math.round((num - integerPart) * 100);

  let crores = Math.floor(integerPart / 10000000);
  integerPart %= 10000000;
  let lakhs = Math.floor(integerPart / 100000);
  integerPart %= 100000;
  let thousands = Math.floor(integerPart / 1000);
  integerPart %= 1000;
  let hundreds = Math.floor(integerPart / 100);
  let remainder = integerPart % 100;

  let words = '';
  if (crores > 0) words += inWords(crores) + 'Crore ';
  if (lakhs > 0) words += inWords(lakhs) + 'Lakh ';
  if (thousands > 0) words += inWords(thousands) + 'Thousand ';
  if (hundreds > 0) words += inWords(hundreds) + 'Hundred ';
  if (remainder > 0) {
    if (words !== '') words += 'and ';
    words += inWords(remainder);
  }
  words = words.trim();
  let resultStr = 'Rupees ' + (words || 'Zero');
  if (decimalPart > 0) {
    resultStr += ' and ' + inWords(decimalPart).trim() + ' Paise';
  }
  return resultStr + ' Only';
}

const formatCurrency = (val) => {
  const n = Number(val || 0);
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export function generateThermalHtml(invoice, companySettings = {}) {
  const company = {
    name: companySettings.company_name || 'Disha Machinary',
    address: companySettings.company_address || 'Plot No. 12, Industrial Estate, Machinery Hub',
    phone: companySettings.company_phone || '+91 98765 43210',
    gstin: companySettings.company_gstin || '33AABCD1234E1Z9',
  };

  const client = invoice.client || {};
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const dateStr = dayjs(invoice.date || new Date()).format('DD/MM/YYYY hh:mm A');
  const totalQty = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const itemsRows = items
    .map(
      (item) => `
      <div class="item-row">
        <div class="item-name">${item.itemName || item.name || 'Product'}</div>
        <div class="item-calc">
          <span>${item.quantity} x ${formatCurrency(item.price)}</span>
          <span class="bold">${formatCurrency((item.quantity || 1) * (item.price || 0))}</span>
        </div>
        ${
          invoice.gstEnabled && item.gstRate
            ? `<div class="item-gst">GST: ${item.gstRate}% ${item.hsnCode ? '| HSN: ' + item.hsnCode : ''}</div>`
            : ''
        }
      </div>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Thermal Bill #${invoice.number}/${invoice.year || ''}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Courier New", monospace, sans-serif;
    }
    body {
      width: 76mm;
      max-width: 76mm;
      margin: 0 auto;
      padding: 8px 4px 20px 4px;
      font-size: 11px;
      color: #000;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .center { text-align: center; }
    .bold { font-weight: 700; }
    .shop-title {
      font-size: 16px;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .shop-sub {
      font-size: 9.5px;
      line-height: 1.3;
    }
    .divider-double {
      border-top: 1px dashed #000;
      border-bottom: 1px dashed #000;
      height: 3px;
      margin: 6px 0;
    }
    .divider-single {
      border-top: 1px dashed #000;
      margin: 5px 0;
    }
    .doc-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      margin: 2px 0 4px 0;
    }
    .meta-line {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      margin: 2px 0;
    }
    .items-header {
      display: flex;
      justify-content: space-between;
      font-size: 10.5px;
      font-weight: 700;
      border-top: 1px dashed #000;
      border-bottom: 1px dashed #000;
      padding: 4px 0;
      margin: 6px 0 4px 0;
    }
    .item-row {
      margin-bottom: 5px;
      font-size: 10.5px;
    }
    .item-name {
      font-weight: 700;
    }
    .item-calc {
      display: flex;
      justify-content: space-between;
      margin-top: 1px;
    }
    .item-gst {
      font-size: 9px;
      color: #333;
    }
    .total-line {
      display: flex;
      justify-content: space-between;
      font-size: 10.5px;
      margin: 2px 0;
    }
    .grand-total {
      font-size: 13px;
      font-weight: 900;
      border-top: 1px dashed #000;
      border-bottom: 1px dashed #000;
      padding: 4px 0;
      margin: 4px 0;
    }
    .footer {
      font-size: 9.5px;
      text-align: center;
      margin-top: 8px;
      line-height: 1.4;
    }
    .barcode-text {
      font-weight: 800;
      letter-spacing: 2px;
      margin: 4px 0;
    }
  </style>
</head>
<body>
  <div class="center">
    <div class="shop-title">${company.name}</div>
    <div class="shop-sub">MACHINERY • SPARES • TOOLS</div>
    <div class="shop-sub">${company.address}</div>
    ${company.phone ? `<div class="shop-sub">Phone: ${company.phone}</div>` : ''}
    ${company.gstin ? `<div class="shop-sub bold">GSTIN: ${company.gstin}</div>` : ''}
  </div>

  <div class="divider-double"></div>

  <div class="center">
    <div class="doc-title">${invoice.gstEnabled ? 'TAX INVOICE' : 'CASH / RETAIL RECEIPT'}</div>
  </div>

  <div class="meta-line">
    <span>Bill No: #${invoice.number}/${invoice.year || ''}</span>
    <span>${dateStr}</span>
  </div>
  <div class="meta-line">
    <span>Cust: ${client.name || 'Walk-in Customer'}</span>
    ${client.phone ? `<span>Ph: ${client.phone}</span>` : ''}
  </div>
  ${
    invoice.buyerGstin || client.gstin
      ? `<div class="meta-line"><span>GSTIN: ${invoice.buyerGstin || client.gstin}</span></div>`
      : ''
  }
  ${
    invoice.paymentMethod
      ? `<div class="meta-line"><span>Payment: ${String(invoice.paymentMethod).toUpperCase()}</span></div>`
      : ''
  }

  <div class="items-header">
    <span>Item Description</span>
    <span>Amount</span>
  </div>

  ${itemsRows}

  <div class="divider-single"></div>

  <div class="total-line">
    <span>Sub Total:</span>
    <span>${formatCurrency(invoice.subTotal)}</span>
  </div>
  ${
    invoice.discount > 0
      ? `<div class="total-line"><span>Discount:</span><span>- ${formatCurrency(invoice.discount)}</span></div>`
      : ''
  }
  ${
    invoice.gstEnabled
      ? invoice.supplyType === 'interstate'
        ? `<div class="total-line"><span>IGST:</span><span>${formatCurrency(invoice.igstTotal || invoice.taxTotal)}</span></div>`
        : `
          <div class="total-line"><span>CGST:</span><span>${formatCurrency(invoice.cgstTotal || (invoice.taxTotal || 0) / 2)}</span></div>
          <div class="total-line"><span>SGST:</span><span>${formatCurrency(invoice.sgstTotal || (invoice.taxTotal || 0) / 2)}</span></div>
        `
      : ''
  }

  <div class="total-line grand-total">
    <span>NET TOTAL:</span>
    <span>${formatCurrency(invoice.total)}</span>
  </div>

  ${
    (() => {
      const paidVal =
        invoice.credit !== undefined
          ? invoice.credit
          : invoice.paidNow !== undefined
          ? invoice.paidNow
          : invoice.paidAmount;
      if (paidVal === undefined || paidVal === null) return '';
      const balanceVal = Math.max(0, Number(invoice.total || 0) - Number(paidVal || 0));
      return `
        <div class="total-line">
          <span>Amount Paid:</span>
          <span class="bold">${formatCurrency(paidVal)}</span>
        </div>
        <div class="total-line ${balanceVal > 0 ? 'bold' : ''}" style="${balanceVal > 0 ? 'color: #b91c1c;' : 'color: #15803d;'}">
          <span>${balanceVal > 0 ? 'Balance Due:' : 'Status:'}</span>
          <span>${balanceVal > 0 ? formatCurrency(balanceVal) + ' (PENDING)' : 'PAID IN FULL'}</span>
        </div>
      `;
    })()
  }

  <div class="divider-single"></div>
  <div class="meta-line">
    <span>Total Items: ${items.length}</span>
    <span>Total Qty: ${totalQty}</span>
  </div>

  <div class="divider-double"></div>

  <div class="footer">
    <div class="bold">* THANK YOU FOR VISITING *</div>
    <div>For inquiries: ${company.phone}</div>
    <div class="barcode-text">*DM-INV-${invoice.number}-${invoice.year}*</div>
    <div>*** DISHA MACHINARY ***</div>
  </div>
</body>
</html>
  `;
}

export function generateA4Html(invoice, companySettings = {}) {
  const company = {
    name: companySettings.company_name || 'Disha Machinary',
    address: companySettings.company_address || 'Plot No. 12, Industrial Estate, Machinery Hub',
    state: companySettings.company_state || 'Tamil Nadu',
    country: companySettings.company_country || 'India',
    phone: companySettings.company_phone || '+91 98765 43210',
    email: companySettings.company_email || 'sales@dishamachinary.com',
    gstin: companySettings.company_gstin || '33AABCD1234E1Z9',
  };

  const client = invoice.client || {};
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const dateStr = dayjs(invoice.date || new Date()).format('DD/MM/YYYY');
  const amountWords = numberToWords(Number(invoice.total || 0));

  const itemsTableRows = items
    .map(
      (item, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td>
          <strong>${item.itemName || item.name || 'Product'}</strong>
          ${item.description ? `<div style="font-size: 10px; color: #555;">${item.description}</div>` : ''}
        </td>
        <td style="text-align: center;">${item.hsnCode || '-'}</td>
        <td style="text-align: center;">${item.quantity || 1}</td>
        <td style="text-align: right;">${formatCurrency(item.price)}</td>
        ${invoice.gstEnabled ? `<td style="text-align: center;">${item.gstRate || 0}%</td>` : ''}
        <td style="text-align: right; font-weight: bold;">${formatCurrency((item.quantity || 1) * (item.price || 0))}</td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice #${invoice.number}/${invoice.year || ''}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    }
    body {
      padding: 10px;
      color: #0f172a;
      background: #fff;
      font-size: 11.5px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .company-title {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .company-sub {
      font-size: 11px;
      color: #475569;
      margin-top: 2px;
    }
    .invoice-title-block {
      text-align: right;
    }
    .invoice-title {
      font-size: 22px;
      font-weight: 900;
      color: #1e3a8a;
      text-transform: uppercase;
    }
    .parties-grid {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 16px;
    }
    .party-card {
      flex: 1;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 12px;
      background: #f8fafc;
    }
    .party-heading {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 6px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 3px;
    }
    .party-name {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 3px;
    }
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    table.items-table th {
      background: #0f172a;
      color: #fff;
      padding: 7px 8px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    table.items-table td {
      border: 1px solid #cbd5e1;
      padding: 7px 8px;
      font-size: 11px;
    }
    .totals-wrapper {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .totals-left {
      width: 55%;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 12px;
      background: #f8fafc;
    }
    .totals-right {
      width: 40%;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 11.5px;
    }
    .grand-row {
      border-top: 2px solid #0f172a;
      border-bottom: 2px solid #0f172a;
      padding: 6px 0;
      font-size: 14px;
      font-weight: 800;
      color: #1e3a8a;
    }
    .sign-wrapper {
      display: flex;
      justify-content: space-between;
      margin-top: 30px;
      padding-top: 10px;
    }
    .sign-box {
      text-align: right;
      width: 200px;
      border-top: 1px solid #0f172a;
      padding-top: 6px;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <table class="header-table">
    <tr>
      <td>
        <div class="company-title">${company.name}</div>
        <div class="company-sub">Machinery • Tools • Spares • Industrial Solutions</div>
        <div class="company-sub">${company.address}, ${company.state}, ${company.country}</div>
        <div class="company-sub">Phone: ${company.phone} | Email: ${company.email}</div>
        <div class="company-sub"><strong>GSTIN:</strong> ${company.gstin}</div>
      </td>
      <td class="invoice-title-block">
        <div class="invoice-title">${invoice.gstEnabled ? 'TAX INVOICE' : 'RETAIL INVOICE'}</div>
        <div style="font-size: 12px; font-weight: 700; margin-top: 4px;">Invoice #: ${invoice.number}/${invoice.year || ''}</div>
        <div style="font-size: 11px; color: #475569;">Date: ${dateStr}</div>
        ${invoice.paymentMethod ? `<div style="font-size: 11px; color: #475569;">Payment: ${String(invoice.paymentMethod).toUpperCase()}</div>` : ''}
      </td>
    </tr>
  </table>

  <div class="parties-grid">
    <div class="party-card">
      <div class="party-heading">Supplier Details</div>
      <div class="party-name">${company.name}</div>
      <div>${company.address}</div>
      <div>${company.state}, ${company.country}</div>
      <div><strong>GSTIN:</strong> ${company.gstin}</div>
    </div>
    <div class="party-card">
      <div class="party-heading">Customer / Buyer Details</div>
      <div class="party-name">${client.name || 'Walk-in Customer'}</div>
      ${client.address ? `<div>${client.address}</div>` : ''}
      ${client.phone ? `<div>Phone: ${client.phone}</div>` : ''}
      ${invoice.buyerGstin || client.gstin ? `<div><strong>GSTIN:</strong> ${invoice.buyerGstin || client.gstin}</div>` : ''}
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 35px; text-align: center;">#</th>
        <th>Description of Goods / Machine</th>
        <th style="width: 70px; text-align: center;">HSN</th>
        <th style="width: 45px; text-align: center;">Qty</th>
        <th style="width: 85px; text-align: right;">Unit Price</th>
        ${invoice.gstEnabled ? '<th style="width: 55px; text-align: center;">GST %</th>' : ''}
        <th style="width: 100px; text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemsTableRows}
    </tbody>
  </table>

  <div class="totals-wrapper">
    <div class="totals-left">
      <div style="font-size: 10.5px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">Amount in Words:</div>
      <div style="font-size: 12px; font-weight: 700; color: #0f172a;">${amountWords}</div>
      <div style="margin-top: 10px; font-size: 10.5px; color: #64748b;">
        <strong>Terms & Conditions:</strong><br />
        1. Goods once sold are covered under standard manufacturer warranty.<br />
        2. Subject to local jurisdiction.
      </div>
    </div>
    <div class="totals-right">
      <div class="totals-row">
        <span>Sub Total:</span>
        <span>${formatCurrency(invoice.subTotal)}</span>
      </div>
      ${
        invoice.discount > 0
          ? `<div class="totals-row"><span>Discount:</span><span>- ${formatCurrency(invoice.discount)}</span></div>`
          : ''
      }
      ${
        invoice.gstEnabled
          ? invoice.supplyType === 'interstate'
            ? `<div class="totals-row"><span>IGST:</span><span>${formatCurrency(invoice.igstTotal || invoice.taxTotal)}</span></div>`
            : `
              <div class="totals-row"><span>CGST:</span><span>${formatCurrency(invoice.cgstTotal || (invoice.taxTotal || 0) / 2)}</span></div>
              <div class="totals-row"><span>SGST:</span><span>${formatCurrency(invoice.sgstTotal || (invoice.taxTotal || 0) / 2)}</span></div>
            `
          : ''
      }
      <div class="totals-row grand-row">
        <span>Grand Total:</span>
        <span>${formatCurrency(invoice.total)}</span>
      </div>
      ${
        (() => {
          const paidVal =
            invoice.credit !== undefined
              ? invoice.credit
              : invoice.paidNow !== undefined
              ? invoice.paidNow
              : invoice.paidAmount;
          if (paidVal === undefined || paidVal === null) return '';
          const balanceVal = Math.max(0, Number(invoice.total || 0) - Number(paidVal || 0));
          return `
            <div class="totals-row" style="color: #1e293b; font-weight: 600; margin-top: 4px;">
              <span>Amount Paid:</span>
              <span>${formatCurrency(paidVal)}</span>
            </div>
            <div class="totals-row" style="${balanceVal > 0 ? 'color: #dc2626; font-weight: 700;' : 'color: #16a34a; font-weight: 700;'}">
              <span>${balanceVal > 0 ? 'Balance Due:' : 'Payment Status:'}</span>
              <span>${balanceVal > 0 ? formatCurrency(balanceVal) + ' (PENDING)' : 'PAID IN FULL'}</span>
            </div>
          `;
        })()
      }
    </div>
  </div>

  <div class="sign-wrapper">
    <div style="font-size: 10.5px; color: #64748b; max-width: 60%;">
      This is a computer-generated tax invoice for Disha Machinary.
    </div>
    <div class="sign-box">
      For ${company.name}<br /><br /><br />
      Authorized Signatory
    </div>
  </div>
</body>
</html>
  `;
}

export function printInvoice(invoice, format = 'thermal', companySettings = {}) {
  if (!invoice) return;

  const isThermal = format === 'thermal';
  const htmlContent = isThermal
    ? generateThermalHtml(invoice, companySettings)
    : generateA4Html(invoice, companySettings);

  const printIframe = document.createElement('iframe');
  printIframe.setAttribute(
    'style',
    'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;'
  );
  document.body.appendChild(printIframe);

  const doc = printIframe.contentWindow.document;
  doc.open();
  doc.write(htmlContent);
  doc.close();

  // Give brief moment for CSS to render then open print dialogue box
  setTimeout(() => {
    try {
      printIframe.contentWindow.focus();
      printIframe.contentWindow.print();
    } catch (err) {
      console.error('Print dialogue box error:', err);
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(printIframe)) {
          document.body.removeChild(printIframe);
        }
      }, 4000);
    }
  }, 250);
}
