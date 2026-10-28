import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { Button, Tooltip, message } from 'antd';
import {
  PrinterOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  BarcodeOutlined,
} from '@ant-design/icons';
import { DOWNLOAD_BASE_URL } from '@/config/serverApiConfig';
import { useMoney } from '@/settings';
import { useSelector } from 'react-redux';
import { selectCompanySettings } from '@/redux/settings/selectors';

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

export default function BillViewer({
  invoice,
  entity = 'invoice',
  showToolbar = true,
  defaultFormat = 'a4',
  onFormatChange,
}) {
  const [activeFormat, setActiveFormat] = useState(defaultFormat);

  useEffect(() => {
    setActiveFormat(defaultFormat);
  }, [defaultFormat]);

  const handleFormatChange = (fmt) => {
    setActiveFormat(fmt);
    if (onFormatChange) {
      onFormatChange(fmt);
    }
  };

  const { moneyFormatter } = useMoney();
  const companySettings = useSelector(selectCompanySettings) || {};

  if (!invoice) return null;

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

  const client = invoice.client || {};
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const currency = invoice.currency || 'INR';
  const payStatus = invoice.paymentStatus || 'unpaid';

  const formattedInvoiceNo = formatInvoiceNumber(invoice.number, invoice.year);
  const primaryMobile = (company.phone || '9751117889').split('/')[0].trim();
  const upiQrString = `upi://pay?pa=${company.upi}&pn=${encodeURIComponent(company.name)}&am=${Number(invoice.total || 0).toFixed(2)}&cu=INR&tn=Bill%20${encodeURIComponent(formattedInvoiceNo)}`;

  const handlePrint = () => {
    const printableArea = document.querySelector('.bill-printable-area');
    if (!printableArea) {
      window.print();
      return;
    }

    try {
      const isThermal = activeFormat === 'thermal';
      const printIframe = document.createElement('iframe');
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      document.body.appendChild(printIframe);

      const doc = printIframe.contentWindow.document;
      doc.open();

      const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
        .map((el) => el.outerHTML)
        .join('\n');

      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>DISHA MACHINERY - Bill ${formattedInvoiceNo}</title>
            ${styles}
            <style>
              @page {
                size: ${isThermal ? '80mm auto' : 'A4 portrait'} !important;
                margin: ${isThermal ? '0mm' : '6mm 8mm'} !important;
              }
              *, *:before, *:after {
                box-sizing: border-box !important;
              }
              body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .disha-tax-invoice {
                border: 1.5px solid #000 !important;
                box-shadow: none !important;
              }
            </style>
          </head>
          <body class="${isThermal ? 'printing-thermal' : 'printing-a4'}">
            ${printableArea.outerHTML}
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        printIframe.contentWindow.focus();
        printIframe.contentWindow.print();
        setTimeout(() => {
          if (document.body.contains(printIframe)) {
            document.body.removeChild(printIframe);
          }
        }, 1500);
      }, 300);
    } catch (e) {
      window.print();
    }
  };

  const handleDownloadA4 = () => {
    window.open(`${DOWNLOAD_BASE_URL}${entity}/${entity}-${invoice._id}.pdf`, '_blank');
  };

  const handleDownloadThermal = () => {
    window.open(`${DOWNLOAD_BASE_URL}${entity}/${entity}-thermal-${invoice._id}.pdf`, '_blank');
  };

  // Min 6 rows to give realistic printed stationery look
  const placeholderCount = Math.max(0, 6 - items.length);
  const placeholderRows = Array.from({ length: placeholderCount });

  return (
    <div className="bill-viewer-container">
      {showToolbar && (
        <div className={`bill-control-bar ${activeFormat === 'a4' ? 'a4-toolbar' : 'thermal-toolbar'}`}>
          <div className="bill-format-tabs">
            <button
              type="button"
              className={`bill-format-tab ${activeFormat === 'a4' ? 'active' : ''}`}
              onClick={() => handleFormatChange('a4')}
            >
              <FileTextOutlined /> A4 Tax Invoice (Official Printed Format)
            </button>
            <button
              type="button"
              className={`bill-format-tab ${activeFormat === 'thermal' ? 'active' : ''}`}
              onClick={() => handleFormatChange('thermal')}
            >
              <BarcodeOutlined /> 80mm POS Slip
            </button>
          </div>

          <div className="bill-actions">
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              onClick={handlePrint}
            >
              Print {activeFormat === 'thermal' ? 'Thermal (80mm)' : 'A4 Tax Invoice'}
            </Button>
            {activeFormat === 'a4' ? (
              <Button
                icon={<FilePdfOutlined />}
                onClick={handleDownloadA4}
              >
                Download A4 PDF
              </Button>
            ) : (
              <Button
                icon={<FilePdfOutlined />}
                onClick={handleDownloadThermal}
              >
                Download Thermal PDF
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ===================================================
          A4 TAX INVOICE (EXACT REPLICA OF PHYSICAL BILL)
          =================================================== */}
      {activeFormat === 'a4' && (
        <div className="bill-paper-a4-wrapper">
          <div className="bill-paper-a4 bill-printable-area disha-tax-invoice">
            {/* 1. TOP HEADER BAR */}
            <div className="disha-top-bar">
              <div className="disha-top-gstin">
                <strong>GSTIN :</strong> {company.gstin}
              </div>
              <div className="disha-top-title">TAX INVOICE</div>
              <div className="disha-top-mobile">
                <strong>Mobile :</strong> {primaryMobile}
              </div>
            </div>

            {/* 2. BRAND CENTER SECTION */}
            <div className="disha-brand-section">
              <div className="disha-emblem-wrap">
                <div className="disha-emblem-circle">
                  <span>DM</span>
                </div>
              </div>
              <div className="disha-brand-info">
                <h1 className="disha-brand-name">{company.name}</h1>
                <div className="disha-brand-tagline">{company.tagline}</div>
                <div className="disha-brand-address">{company.address}</div>
                <div className="disha-brand-phones">
                  <strong>Mobile :</strong> {company.phone}
                </div>
              </div>
            </div>

            {/* 3. PARTIES & INVOICE META GRID */}
            <div className="disha-parties-grid">
              {/* Billed To Box */}
              <div className="disha-party-box disha-billed-box">
                <div className="disha-party-header">Billed to</div>
                <div className="disha-party-name">{client.name || 'HALEEM BASHA'}</div>
                <div className="disha-party-addr">{client.address || client.city || 'TIRUPATTUR'}</div>
                <div className="disha-party-addr">{client.state || 'TIRUPATTUR'}</div>
                <div className="disha-party-row">
                  <span>GSTIN :</span> <span>{invoice.buyerGstin || client.gstin || ''}</span>
                </div>
                <div className="disha-party-row disha-phone-row">
                  <span>Mobile No :</span> <span>{client.phone || '8122638760'}</span>
                </div>
              </div>

              {/* Consignee / Shipped To Box */}
              <div className="disha-party-box disha-shipped-box">
                <div className="disha-party-header">Consignee / Shipped to</div>
                <div className="disha-party-name">{invoice.consigneeName || client.name || 'HALEEM BASHA'}</div>
                <div className="disha-party-addr">{invoice.consigneeAddress || client.address || client.city || 'TIRUPATTUR'}</div>
                <div className="disha-party-addr">{client.state || 'TIRUPATTUR'}</div>
                <div className="disha-party-row">
                  <span>GSTIN :</span> <span>{invoice.consigneeGstin || invoice.buyerGstin || client.gstin || ''}</span>
                </div>
                <div className="disha-party-row disha-phone-row">
                  <span>Mobile No :</span> <span>{invoice.consigneePhone || client.phone || '8122638760'}</span>
                </div>
              </div>

              {/* Invoice Meta Box */}
              <div className="disha-meta-box">
                <div className="disha-meta-row">
                  <span className="disha-meta-lbl">Invoice No :</span>
                  <span className="disha-meta-val disha-inv-no-val">{formattedInvoiceNo}</span>
                </div>
                <div className="disha-meta-row">
                  <span className="disha-meta-lbl">Invoice Date :</span>
                  <span className="disha-meta-val">{dayjs(invoice.date).format('DD/MM/YYYY')}</span>
                </div>
                <div className="disha-meta-row">
                  <span className="disha-meta-lbl">Vehicle No :</span>
                  <span className="disha-meta-val">{invoice.vehicleNo || ''}</span>
                </div>
                <div className="disha-meta-row">
                  <span className="disha-meta-lbl">Transport :</span>
                  <span className="disha-meta-val">{invoice.transport || ''}</span>
                </div>
              </div>
            </div>

            {/* 4. MAIN ITEMS TABLE */}
            <div className="disha-table-container">
              <table className="disha-items-table">
                <thead>
                  <tr>
                    <th style={{ width: '4%' }} rowSpan={2}>No</th>
                    <th style={{ width: '28%' }} rowSpan={2}>Particulars</th>
                    <th style={{ width: '9%' }} rowSpan={2}>Hsn Code</th>
                    <th style={{ width: '10%' }} rowSpan={2}>Rate</th>
                    <th style={{ width: '12%' }} colSpan={2}>Qty</th>
                    <th style={{ width: '7%' }} rowSpan={2}>GST %</th>
                    <th style={{ width: '8%' }} rowSpan={2}>CGST</th>
                    <th style={{ width: '8%' }} rowSpan={2}>SGST</th>
                    <th style={{ width: '8%' }} rowSpan={2}>IGST</th>
                    <th style={{ width: '12%' }} rowSpan={2}>Amount</th>
                  </tr>
                  <tr>
                    <th style={{ width: '6%', fontSize: '9.5px', padding: '3px 2px' }}>Qty/wet</th>
                    <th style={{ width: '6%', fontSize: '9.5px', padding: '3px 2px' }}>Nos/lth</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item._id || idx}>
                      <td className="text-center">{idx + 1}</td>
                      <td className="text-left font-bold">{item.itemName}</td>
                      <td className="text-center">{item.hsnCode || '-'}</td>
                      <td className="text-right">{Number(item.price || 0).toFixed(2)}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-center"></td>
                      <td className="text-center">
                        {item.gstRate ? `${Number(item.gstRate).toFixed(2)}` : '0.00'}
                      </td>
                      <td className="text-right">
                        {item.cgst ? Number(item.cgst).toFixed(2) : (invoice.gstEnabled && invoice.supplyType === 'intrastate' ? (Number(item.taxAmount || 0) / 2).toFixed(2) : '')}
                      </td>
                      <td className="text-right">
                        {item.sgst ? Number(item.sgst).toFixed(2) : (invoice.gstEnabled && invoice.supplyType === 'intrastate' ? (Number(item.taxAmount || 0) / 2).toFixed(2) : '')}
                      </td>
                      <td className="text-right">
                        {item.igst ? Number(item.igst).toFixed(2) : (invoice.gstEnabled && invoice.supplyType === 'interstate' ? Number(item.taxAmount || 0).toFixed(2) : '')}
                      </td>
                      <td className="text-right font-bold">
                        {Number(item.taxableValue || item.total || (item.quantity * item.price)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {placeholderRows.map((_, pIdx) => (
                    <tr key={`ph-${pIdx}`} className="disha-placeholder-row">
                      <td className="text-center">&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 5. BOTTOM SECTION: BANK, QR CODE & CALCULATION TOTALS */}
            <div className="disha-bottom-grid">
              {/* Bottom Left: Bank Details & Words */}
              <div className="disha-bottom-left">
                <div className="disha-bank-header">Bank Details</div>
                <div className="disha-bank-line">
                  <span className="lbl">A/C NAME :</span> <span className="val">{company.accountName}</span>
                </div>
                <div className="disha-bank-split">
                  <div>
                    <span className="lbl">A/C NO :</span> <span className="val">{company.bankAccount}</span>
                  </div>
                  <div>
                    <span className="lbl">IFSC :</span> <span className="val">{company.bankIfsc}</span>
                  </div>
                </div>
                <div className="disha-bank-split">
                  <div>
                    <span className="lbl">BANK :</span> <span className="val">{company.bankName}</span>
                  </div>
                  <div>
                    <span className="lbl">BRANCH :</span> <span className="val">{company.bankBranch}</span>
                  </div>
                </div>

                <div className="disha-words-box">
                  {numberToWords(invoice.total)}
                </div>

                <div className="disha-terms-line">
                  1. Goods Once sold Cannot be taken back
                </div>
              </div>

              {/* Bottom Center: Dynamic UPI QR Code */}
              <div className="disha-bottom-center">
                <div className="disha-qr-box">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=115x115&data=${encodeURIComponent(upiQrString)}`}
                    alt="UPI QR Code"
                    className="disha-qr-img"
                  />
                  <div className="disha-qr-text">Scan & Pay via UPI</div>
                </div>
              </div>

              {/* Bottom Right: Taxes & Total */}
              <div className="disha-bottom-right">
                <div className="disha-calc-row">
                  <span className="lbl">Freight</span>
                  <span className="val">{invoice.freight ? Number(invoice.freight).toFixed(2) : ''}</span>
                </div>
                <div className="disha-calc-row">
                  <span className="lbl">CGST :</span>
                  <span className="val">
                    {invoice.cgstTotal ? Number(invoice.cgstTotal).toFixed(2) : (invoice.gstEnabled && invoice.supplyType === 'intrastate' ? (Number(invoice.taxTotal || 0) / 2).toFixed(2) : '')}
                  </span>
                </div>
                <div className="disha-calc-row">
                  <span className="lbl">SGST :</span>
                  <span className="val">
                    {invoice.sgstTotal ? Number(invoice.sgstTotal).toFixed(2) : (invoice.gstEnabled && invoice.supplyType === 'intrastate' ? (Number(invoice.taxTotal || 0) / 2).toFixed(2) : '')}
                  </span>
                </div>
                <div className="disha-calc-row">
                  <span className="lbl">IGST :</span>
                  <span className="val">
                    {invoice.igstTotal ? Number(invoice.igstTotal).toFixed(2) : (invoice.gstEnabled && invoice.supplyType === 'interstate' ? Number(invoice.taxTotal || 0).toFixed(2) : '')}
                  </span>
                </div>

                <div className="disha-total-box">
                  <span className="lbl">TOTAL :</span>
                  <span className="val">{Number(invoice.total || 0).toFixed(2)}</span>
                </div>

                <div className="disha-sign-block">
                  <div className="disha-for-name">For {company.name}</div>
                  <div className="disha-sign-placeholder"></div>
                  <div className="disha-sign-lbl">Authorized Signatory</div>
                </div>
              </div>
            </div>

            {/* 6. BOTTOM GREETING FOOTER */}
            <div className="disha-footer-banner">
              Thanks so much for your purchase! You made our day, so we hope you have a great one yourself. See you again soon!
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          THERMAL 80MM BILL
          =================================================== */}
      {activeFormat === 'thermal' && (
        <div className="bill-paper-thermal bill-printable-area">
          <div className="thermal-center">
            <div className="thermal-brand-title">{company.name}</div>
            <div className="thermal-sub">ALL KINDS OF MACHINERY & SPARES</div>
            <div className="thermal-sub">{company.address}</div>
            <div className="thermal-sub">Mob: {company.phone}</div>
            <div className="thermal-sub bold">GSTIN: {company.gstin}</div>
          </div>

          <div className="thermal-divider-double" />

          <div className="thermal-center">
            <div className="thermal-doc-title">{invoice.gstEnabled ? 'TAX INVOICE' : 'RETAIL BILL'}</div>
          </div>

          <div className="thermal-meta-row">
            <span>Bill No: {formattedInvoiceNo}</span>
            <span>{dayjs(invoice.date).format('DD/MM/YY hh:mm A')}</span>
          </div>

          <div className="thermal-meta-row">
            <span>Cust: {client.name || 'Walk-in Customer'}</span>
            <span>{client.phone || ''}</span>
          </div>

          <div className="thermal-divider-single" />

          <div className="thermal-items-header">
            <span>Item Description</span>
            <span style={{ textAlign: 'right' }}>Amount</span>
          </div>

          {items.map((it, idx) => (
            <div key={idx} className="thermal-item-row">
              <div className="thermal-item-name">{it.itemName}</div>
              <div className="thermal-item-calc">
                <span>{it.quantity} x {Number(it.price).toFixed(2)}</span>
                <span className="bold">{Number(it.quantity * it.price).toFixed(2)}</span>
              </div>
            </div>
          ))}

          <div className="thermal-divider-single" />

          <div className="thermal-total-row">
            <span>Sub Total:</span>
            <span>{Number(invoice.subTotal).toFixed(2)}</span>
          </div>

          {invoice.gstEnabled && (
            <>
              <div className="thermal-total-row">
                <span>CGST:</span>
                <span>{Number(invoice.cgstTotal || (invoice.taxTotal || 0) / 2).toFixed(2)}</span>
              </div>
              <div className="thermal-total-row">
                <span>SGST:</span>
                <span>{Number(invoice.sgstTotal || (invoice.taxTotal || 0) / 2).toFixed(2)}</span>
              </div>
            </>
          )}

          <div className="thermal-total-row thermal-net-total">
            <span>NET TOTAL:</span>
            <span>₹{Number(invoice.total || 0).toFixed(2)}</span>
          </div>

          <div className="thermal-center" style={{ marginTop: 12 }}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=95x95&data=${encodeURIComponent(upiQrString)}`}
              alt="UPI QR Code"
              style={{ width: 85, height: 85 }}
            />
            <div style={{ fontSize: 9, marginTop: 4 }}>Scan & Pay: {company.upi}</div>
          </div>

          <div className="thermal-divider-double" />

          <div className="thermal-footer">
            <div className="bold">Thanks so much for your purchase!</div>
            <div>See you again soon!</div>
          </div>
        </div>
      )}
    </div>
  );
}
