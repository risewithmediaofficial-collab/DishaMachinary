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
  let resultStr = 'Rupees : ' + (words || 'Zero');
  if (decimalPart > 0) {
    resultStr += ' and ' + inWords(decimalPart).trim() + ' Paise';
  }
  return resultStr + ' Only';
}

export function formatInvoiceNumber(number, year) {
  if (!number) return '';
  const yr = Number(year || new Date().getFullYear());
  const y1 = yr % 100;
  const y2 = (yr + 1) % 100;
  const prefix = `${y1 < 10 ? '0' + y1 : y1}-${y2 < 10 ? '0' + y2 : y2}`;
  return `${prefix}/${number}`;
}

const formatCurrency = (val) => {
  const n = Number(val || 0);
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export function generateThermalHtml(invoice, companySettings = {}, entity = 'invoice') {
  const company = {
    name: companySettings.company_name || 'DISHA MACHINERY',
    address: companySettings.company_address || 'Annamalai Complex, New Busstand, Tirupattur Dist - 635601',
    phone: companySettings.company_phone || '9751117889 / 9626957000 / 04179-2266666 / 294650',
    gstin: companySettings.company_gstin || '33GPNPS1888N1ZT',
    upi: companySettings.company_upi || '9751117889@federal',
  };

  const isQuote = entity === 'quote' || invoice.isQuote || invoice.type === 'quote';
  const client = invoice.client || {};
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const dateStr = dayjs(invoice.date || new Date()).format('DD/MM/YYYY hh:mm A');
  const totalQty = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const formattedInvoiceNo = formatInvoiceNumber(invoice.number, invoice.year);
  const docNumberDisplay = isQuote
    ? (formattedInvoiceNo.startsWith('QT-') ? formattedInvoiceNo : `QT-${formattedInvoiceNo}`)
    : formattedInvoiceNo;

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
  <title>Thermal Bill ${formattedInvoiceNo}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    }
    body {
      width: 80mm;
      max-width: 80mm;
      padding: 4mm 3mm;
      color: #000;
      background: #fff;
      font-size: 11px;
    }
    .center { text-align: center; }
    .bold { font-weight: 700; }
    .shop-title { font-size: 14px; font-weight: 900; margin-bottom: 2px; }
    .shop-sub { font-size: 9.5px; line-height: 1.3; }
    .divider-double { border-top: 2px dashed #000; margin: 5px 0; }
    .divider-single { border-top: 1px dashed #000; margin: 4px 0; }
    .doc-title { font-size: 11.5px; font-weight: 800; letter-spacing: 1px; margin: 2px 0; }
    .meta-line { display: flex; justify-content: space-between; font-size: 10px; margin: 2px 0; }
    .items-header {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      font-weight: 700;
      border-top: 1px dashed #000;
      border-bottom: 1px dashed #000;
      padding: 3px 0;
      margin: 4px 0;
    }
    .item-row { margin-bottom: 4px; font-size: 10px; }
    .item-name { font-weight: 700; }
    .item-calc { display: flex; justify-content: space-between; }
    .total-line { display: flex; justify-content: space-between; font-size: 10.5px; margin: 2px 0; }
    .grand-total {
      font-size: 12.5px;
      font-weight: 900;
      border-top: 1px dashed #000;
      border-bottom: 1px dashed #000;
      padding: 4px 0;
      margin: 4px 0;
    }
    .footer { font-size: 9.5px; text-align: center; margin-top: 6px; line-height: 1.35; }
  </style>
</head>
<body>
  <div class="center">
    <div class="shop-title">${company.name}</div>
    <div class="shop-sub">ALL KINDS OF MACHINERY & SPARES</div>
    <div class="shop-sub">${company.address}</div>
    <div class="shop-sub">Mob: ${company.phone}</div>
    <div class="shop-sub bold">GSTIN: ${company.gstin}</div>
  </div>

  <div class="divider-double"></div>

  <div class="center">
    <div class="doc-title">${isQuote ? 'ESTIMATE / QUOTATION' : (invoice.gstEnabled ? 'TAX INVOICE' : 'RETAIL BILL')}</div>
  </div>

  <div class="meta-line">
    <span>${isQuote ? 'Quote No:' : 'Invoice No:'} ${docNumberDisplay}</span>
    <span>${dateStr}</span>
  </div>
  <div class="meta-line">
    <span>Customer: ${client.name || 'Walk-in Customer'}</span>
    ${client.phone ? `<span>Ph: ${client.phone}</span>` : ''}
  </div>

  <div class="items-header">
    <span>Item Particulars</span>
    <span>Amount</span>
  </div>

  ${itemsRows}

  <div class="divider-single"></div>

  <div class="total-line">
    <span>Sub Total:</span>
    <span>${formatCurrency(invoice.subTotal)}</span>
  </div>
  ${
    invoice.gstEnabled
      ? `
      <div class="total-line"><span>CGST:</span><span>${formatCurrency(invoice.cgstTotal || (invoice.taxTotal || 0) / 2)}</span></div>
      <div class="total-line"><span>SGST:</span><span>${formatCurrency(invoice.sgstTotal || (invoice.taxTotal || 0) / 2)}</span></div>
      `
      : ''
  }

  <div class="total-line grand-total">
    <span>NET TOTAL:</span>
    <span>${formatCurrency(invoice.total)}</span>
  </div>

  <div class="divider-single"></div>
  <div class="meta-line">
    <span>Total Items: ${items.length}</span>
    <span>Total Qty: ${totalQty}</span>
  </div>

  <div class="footer">
    <div class="bold">${isQuote ? 'Thank you for considering our quotation!' : 'Thanks so much for your purchase!'}</div>
    <div>${isQuote ? 'Valid for 30 days from date of issue' : 'See you again soon!'}</div>
  </div>
</body>
</html>
  `;
}

export function generateA4Html(invoice, companySettings = {}, entity = 'invoice') {
  const company = {
    name: companySettings.company_name || 'DISHA MACHINERY',
    tagline:
      companySettings.company_tagline ||
      '[ All Kinds of Machinery, All Kinds of Welding & Wiring Equipment and foods ]',
    address:
      companySettings.company_address ||
      'Annamalai Complex, New Busstand, Tirupattur Dist - 635601',
    state: companySettings.company_state || 'Tamil Nadu',
    country: companySettings.company_country || 'India',
    phone:
      companySettings.company_phone ||
      '9751117889 / 9626957000 / 04179-2266666 / 294650',
    email: companySettings.company_email || 'dishamachinery@gmail.com',
    gstin: companySettings.company_gstin || '33GPNPS1888N1ZT',
    regNo: companySettings.company_reg_number || 'DM/26-27',
    bankName: companySettings.company_bank_name || 'FEDERAL BANK',
    bankAccount: companySettings.company_bank_account || '20695500000537',
    bankIfsc: companySettings.company_bank_ifsc || 'FDRL0002069',
    bankBranch: companySettings.company_bank_branch || 'TIRUPATHUR',
    accountName: companySettings.company_name || 'DISHA MACHINERY',
    upi: companySettings.company_upi || '9751117889@federal',
  };

  const isQuote = entity === 'quote' || invoice.isQuote || invoice.type === 'quote';
  const client = invoice.client || {};
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const dateStr = dayjs(invoice.date || new Date()).format('DD/MM/YYYY');
  const amountWords = numberToWords(Number(invoice.total || 0));
  const formattedInvoiceNo = formatInvoiceNumber(invoice.number, invoice.year);
  const docNumberDisplay = isQuote
    ? (formattedInvoiceNo.startsWith('QT-') ? formattedInvoiceNo : `QT-${formattedInvoiceNo}`)
    : formattedInvoiceNo;
  const primaryMobile = (company.phone || '9751117889').split('/')[0].trim();
  const upiQrString = `upi://pay?pa=${company.upi}&pn=${encodeURIComponent(company.name)}&am=${Number(invoice.total || 0).toFixed(2)}&cu=INR&tn=Bill%20${encodeURIComponent(formattedInvoiceNo)}`;

  const itemsTableRows = items
    .map(
      (item, idx) => `
      <tr>
        <td style="text-align: center; border-left: 1px solid #000; border-right: 1px solid #000; padding: 4px;">${idx + 1}</td>
        <td style="text-align: left; font-weight: bold; border-left: 1px solid #000; border-right: 1px solid #000; padding: 4px;">${item.itemName || item.name || 'Product'}</td>
        <td style="text-align: center; border-left: 1px solid #000; border-right: 1px solid #000; padding: 4px;">${item.hsnCode || '-'}</td>
        <td style="text-align: right; border-left: 1px solid #000; border-right: 1px solid #000; padding: 4px;">${Number(item.price || 0).toFixed(2)}</td>
        <td style="text-align: center; border-left: 1px solid #000; border-right: 1px solid #000; padding: 4px;">${item.quantity || 1}</td>
        <td style="text-align: center; border-left: 1px solid #000; border-right: 1px solid #000; padding: 4px;"></td>
        <td style="text-align: center; border-left: 1px solid #000; border-right: 1px solid #000; padding: 4px;">${item.gstRate ? Number(item.gstRate).toFixed(2) : '0.00'}</td>
        <td style="text-align: right; border-left: 1px solid #000; border-right: 1px solid #000; padding: 4px;">${item.cgst ? Number(item.cgst).toFixed(2) : (invoice.gstEnabled && invoice.supplyType === 'intrastate' ? (Number(item.taxAmount || 0) / 2).toFixed(2) : '')}</td>
        <td style="text-align: right; border-left: 1px solid #000; border-right: 1px solid #000; padding: 4px;">${item.sgst ? Number(item.sgst).toFixed(2) : (invoice.gstEnabled && invoice.supplyType === 'intrastate' ? (Number(item.taxAmount || 0) / 2).toFixed(2) : '')}</td>
        <td style="text-align: right; border-left: 1px solid #000; border-right: 1px solid #000; padding: 4px;">${item.igst ? Number(item.igst).toFixed(2) : (invoice.gstEnabled && invoice.supplyType === 'interstate' ? Number(item.taxAmount || 0).toFixed(2) : '')}</td>
        <td style="text-align: right; font-weight: bold; border-left: 1px solid #000; border-right: 1px solid #000; padding: 4px;">${Number(item.taxableValue || item.total || (item.quantity * item.price)).toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  const placeholderRows = Array.from({ length: Math.max(0, 6 - items.length) })
    .map(
      () => `
      <tr style="height: 24px;">
        <td style="border-left: 1px solid #000; border-right: 1px solid #000;">&nbsp;</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000;">&nbsp;</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000;">&nbsp;</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000;">&nbsp;</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000;">&nbsp;</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000;">&nbsp;</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000;">&nbsp;</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000;">&nbsp;</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000;">&nbsp;</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000;">&nbsp;</td>
        <td style="border-left: 1px solid #000; border-right: 1px solid #000;">&nbsp;</td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>DISHA MACHINERY - ${isQuote ? 'Quotation' : 'Tax Invoice'} ${docNumberDisplay}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 6mm 8mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    }
    body {
      padding: 10px;
      color: #000;
      background: #fff;
      font-size: 11px;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .disha-tax-invoice {
      border: 1.5px solid #000;
      padding: 12px 14px 8px;
    }
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 5px;
      border-bottom: 1px solid #000;
      font-size: 11px;
    }
    .brand-section {
      text-align: center;
      position: relative;
      padding: 6px 0 8px;
    }
    .brand-name {
      font-size: 27px;
      font-weight: 800;
      color: #2e7d32;
      font-family: Georgia, "Times New Roman", serif;
      letter-spacing: 1px;
    }
    .parties-grid {
      display: grid;
      grid-template-columns: 1.15fr 1.15fr 1.2fr;
      border: 1px solid #000;
      font-size: 10.5px;
      margin-top: 6px;
    }
    .party-box {
      padding: 6px 8px;
      border-right: 1px solid #000;
    }
    .party-header {
      color: #1d4ed8;
      font-weight: 700;
      text-decoration: underline;
      margin-bottom: 3px;
    }
    .party-name {
      font-weight: 800;
      color: #991b1b;
      font-size: 12px;
      text-transform: uppercase;
    }
    .meta-box {
      padding: 6px 8px;
      font-size: 10.5px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }
    table.disha-items-table {
      width: 100%;
      border-collapse: collapse;
      border-left: 1px solid #000;
      border-right: 1px solid #000;
      border-bottom: 1px solid #000;
      font-size: 10.5px;
    }
    table.disha-items-table th {
      border: 1px solid #000;
      padding: 5px 4px;
      font-weight: 700;
      text-align: center;
      background: #fff;
    }
    .bottom-grid {
      display: grid;
      grid-template-columns: ${isQuote ? '1.6fr 1.4fr' : '1.4fr 0.9fr 1.3fr'};
      border-left: 1px solid #000;
      border-right: 1px solid #000;
      border-bottom: 1px solid #000;
      padding: 6px 8px;
      gap: ${isQuote ? '16px' : '8px'};
      font-size: 10.5px;
    }
    .total-box {
      display: flex;
      justify-content: space-between;
      border: 1.5px solid #000;
      padding: 4px 6px;
      margin: 5px 0 6px;
      font-size: 13px;
      font-weight: 800;
      color: #991b1b;
    }
    .footer-banner {
      text-align: center;
      color: #1e40af;
      font-weight: 700;
      font-size: 11px;
      margin-top: 8px;
      padding-top: 4px;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="disha-tax-invoice">
    <div class="top-bar">
      <div><strong>GSTIN :</strong> ${company.gstin}</div>
      <div style="font-weight: 800; font-size: 13px; ${isQuote ? 'color: #0284c7;' : ''}">${isQuote ? 'QUOTATION' : 'TAX INVOICE'}</div>
      <div style="color: #991b1b; font-weight: 700;"><strong>Mobile :</strong> ${primaryMobile}</div>
    </div>

    <div class="brand-section">
      <div class="brand-name">${company.name}</div>
      <div style="font-size: 10.5px; font-weight: 700; color: #1e293b; margin: 2px 0;">${company.tagline}</div>
      <div style="font-size: 11px; font-weight: 600; color: #1e293b;">${company.address}</div>
      <div style="font-size: 11px; font-weight: 700; color: #991b1b; margin-top: 2px;"><strong>Mobile :</strong> ${company.phone}</div>
    </div>

    <div class="parties-grid">
      <div class="party-box">
        <div class="party-header">${isQuote ? 'Quoted to' : 'Billed to'}</div>
        <div class="party-name">${client.name || 'HALEEM BASHA'}</div>
        <div style="font-weight: 700;">${client.address || client.city || 'TIRUPATTUR'}</div>
        <div style="font-weight: 700;">${client.state || 'TIRUPATTUR'}</div>
        <div style="display: flex; justify-content: space-between; margin-top: 2px;">
          <span>GSTIN :</span> <span>${invoice.buyerGstin || client.gstin || ''}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 2px; color: #991b1b; font-weight: 700;">
          <span>Mobile No :</span> <span>${client.phone || '8122638760'}</span>
        </div>
      </div>

      <div class="party-box">
        <div class="party-header">Consignee / Shipped to</div>
        <div class="party-name">${invoice.consigneeName || client.name || 'HALEEM BASHA'}</div>
        <div style="font-weight: 700;">${invoice.consigneeAddress || client.address || client.city || 'TIRUPATTUR'}</div>
        <div style="font-weight: 700;">${client.state || 'TIRUPATTUR'}</div>
        <div style="display: flex; justify-content: space-between; margin-top: 2px;">
          <span>GSTIN :</span> <span>${invoice.consigneeGstin || invoice.buyerGstin || client.gstin || ''}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 2px; color: #991b1b; font-weight: 700;">
          <span>Mobile No :</span> <span>${invoice.consigneePhone || client.phone || '8122638760'}</span>
        </div>
      </div>

      <div class="meta-box">
        <div class="meta-row">
          <span style="font-weight: 600;">${isQuote ? 'Quotation No :' : 'Invoice No :'}</span>
          <span style="color: #991b1b; font-weight: 800;">${docNumberDisplay}</span>
        </div>
        <div class="meta-row">
          <span style="font-weight: 600;">${isQuote ? 'Quotation Date :' : 'Invoice Date :'}</span>
          <span style="font-weight: 700;">${dateStr}</span>
        </div>
        <div class="meta-row">
          <span style="font-weight: 600;">Vehicle No :</span>
          <span style="font-weight: 700;">${invoice.vehicleNo || ''}</span>
        </div>
        <div class="meta-row">
          <span style="font-weight: 600;">Transport :</span>
          <span style="font-weight: 700;">${invoice.transport || ''}</span>
        </div>
      </div>
    </div>

    <table class="disha-items-table">
      <thead>
        <tr>
          <th style="width: 4%;" rowspan="2">No</th>
          <th style="width: 28%;" rowspan="2">Particulars</th>
          <th style="width: 9%;" rowspan="2">Hsn Code</th>
          <th style="width: 10%;" rowspan="2">Rate</th>
          <th style="width: 12%;" colspan="2">Qty</th>
          <th style="width: 7%;" rowspan="2">GST %</th>
          <th style="width: 8%;" rowspan="2">CGST</th>
          <th style="width: 8%;" rowspan="2">SGST</th>
          <th style="width: 8%;" rowspan="2">IGST</th>
          <th style="width: 12%;" rowspan="2">Amount</th>
        </tr>
        <tr>
          <th style="width: 6%; font-size: 9.5px; padding: 2px;">Qty/wet</th>
          <th style="width: 6%; font-size: 9.5px; padding: 2px;">Nos/lth</th>
        </tr>
      </thead>
      <tbody>
        ${itemsTableRows}
        ${placeholderRows}
      </tbody>
    </table>

    <div class="bottom-grid">
      <div>
        <div style="color: #991b1b; font-weight: 700; text-decoration: underline; margin-bottom: 3px;">
          ${isQuote ? 'Bank Details (For Quotation)' : 'Bank Details'}
        </div>
        <div style="color: #1e40af; font-weight: 700; margin-bottom: 2px;"><strong>A/C NAME :</strong> ${company.accountName}</div>
        <div style="display: flex; justify-content: space-between; color: #1e40af; font-weight: 700; margin-bottom: 2px;">
          <span><strong>A/C NO :</strong> ${company.bankAccount}</span>
          <span><strong>IFSC :</strong> ${company.bankIfsc}</span>
        </div>
        <div style="display: flex; justify-content: space-between; color: #1e40af; font-weight: 700; margin-bottom: 2px;">
          <span><strong>BANK :</strong> ${company.bankName}</span>
          <span><strong>BRANCH :</strong> ${company.bankBranch}</span>
        </div>
        <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #000; font-weight: 700;">
          ${amountWords}
        </div>
        <div style="margin-top: 4px; font-size: 9.5px; font-weight: 600;">
          ${isQuote ? '1. Quotation valid for 30 days from date of issue. Prices subject to confirmation upon order.' : '1. Goods Once sold Cannot be taken back'}
        </div>
      </div>

      ${
        !isQuote
          ? `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; border-left: 1px dashed #000; border-right: 1px dashed #000;">
        <img
          src="https://api.qrserver.com/v1/create-qr-code/?size=105x105&data=${encodeURIComponent(upiQrString)}"
          alt="UPI QR"
          style="width: 95px; height: 95px;"
        />
        <div style="font-size: 8.5px; font-weight: 700; margin-top: 3px; color: #1e40af;">Scan & Pay via UPI</div>
      </div>
      `
          : ''
      }

      <div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span>Freight</span>
          <span>${invoice.freight ? Number(invoice.freight).toFixed(2) : ''}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span>CGST :</span>
          <span>${invoice.cgstTotal ? Number(invoice.cgstTotal).toFixed(2) : (invoice.gstEnabled && invoice.supplyType === 'intrastate' ? (Number(invoice.taxTotal || 0) / 2).toFixed(2) : '')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span>SGST :</span>
          <span>${invoice.sgstTotal ? Number(invoice.sgstTotal).toFixed(2) : (invoice.gstEnabled && invoice.supplyType === 'intrastate' ? (Number(invoice.taxTotal || 0) / 2).toFixed(2) : '')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span>IGST :</span>
          <span>${invoice.igstTotal ? Number(invoice.igstTotal).toFixed(2) : (invoice.gstEnabled && invoice.supplyType === 'interstate' ? Number(invoice.taxTotal || 0).toFixed(2) : '')}</span>
        </div>

        <div class="total-box">
          <span>TOTAL :</span>
          <span>${Number(invoice.total || 0).toFixed(2)}</span>
        </div>

        <div style="text-align: right; margin-top: 6px;">
          <div style="font-size: 10px; font-weight: 700;">For ${company.name}</div>
          <div style="height: 28px;"></div>
          <div style="font-size: 9.5px; font-weight: 600;">Authorized Signatory</div>
        </div>
      </div>
    </div>

    <div class="footer-banner">
      ${isQuote ? 'Thank you for considering DISHA MACHINERY! Looking forward to doing business with you.' : 'Thanks so much for your purchase! You made our day, so we hope you have a great one yourself. See you again soon!'}
    </div>
  </div>
</body>
</html>
  `;
}

export function printInvoice(invoice, format = 'a4', companySettings = {}, entity = 'invoice') {
  if (!invoice) return;

  const isThermal = format === 'thermal';
  const htmlContent = isThermal
    ? generateThermalHtml(invoice, companySettings, entity)
    : generateA4Html(invoice, companySettings, entity);

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
