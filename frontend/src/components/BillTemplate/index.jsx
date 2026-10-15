import { useState } from 'react';
import dayjs from 'dayjs';
import { Button, Tooltip, message } from 'antd';
import {
  PrinterOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  BarcodeOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { DOWNLOAD_BASE_URL } from '@/config/serverApiConfig';
import { useMoney } from '@/settings';
import { useSelector } from 'react-redux';
import { selectCompanySettings } from '@/redux/settings/selectors';

export function numberToWords(num) {
  if (typeof num !== 'number' || isNaN(num) || num <= 0) return 'Zero Rupees Only';
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ',
    'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
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

export default function BillViewer({ invoice, entity = 'invoice', showToolbar = true, defaultFormat = 'a4' }) {
  const [activeFormat, setActiveFormat] = useState(defaultFormat); // 'a4' or 'thermal'
  const { moneyFormatter } = useMoney();
  const companySettings = useSelector(selectCompanySettings) || {};

  if (!invoice) return null;

  const company = {
    name: companySettings.company_name || 'Disha Machinary',
    address: companySettings.company_address || 'Plot No. 12, Industrial Estate, Machinery Hub',
    state: companySettings.company_state || 'Tamil Nadu',
    country: companySettings.company_country || 'India',
    phone: companySettings.company_phone || '+91 98765 43210',
    email: companySettings.company_email || 'sales@dishamachinary.com',
    gstin: companySettings.company_gstin || '33AABCD1234E1Z9',
    regNo: companySettings.company_reg_number || 'DM/IND/2026/089',
    bank: companySettings.company_bank_account || 'Bank: HDFC Bank | A/C: 50200012345678 | IFSC: HDFC0001234',
  };

  const client = invoice.client || {};
  const items = invoice.items || [];
  const currency = invoice.currency || 'INR';
  const payStatus = invoice.paymentStatus || 'unpaid';

  const handlePrint = () => {
    const printableArea = document.querySelector('.bill-printable-area');
    if (!printableArea) {
      window.print();
      return;
    }

    try {
      const isThermal = activeFormat === 'thermal';
      const measuredHeight = Math.ceil(printableArea.offsetHeight || printableArea.scrollHeight || 300);
      const thermalPageHeight = `${measuredHeight + 12}px`;

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
            <title>Disha Machinary - Bill #${invoice.number}/${invoice.year || ''}</title>
            ${styles}
            <style>
              @page {
                size: ${isThermal ? `80mm ${thermalPageHeight}` : 'A4 portrait'} !important;
                margin: ${isThermal ? '0mm' : '8mm 10mm'} !important;
              }
              *, *:before, *:after {
                box-sizing: border-box !important;
              }
              html {
                margin: 0 !important;
                padding: 0 !important;
                height: auto !important;
                min-height: 0 !important;
                max-height: none !important;
                background: #ffffff !important;
              }
              body {
                margin: 0 !important;
                padding: 0 !important;
                height: auto !important;
                min-height: 0 !important;
                max-height: none !important;
                width: ${isThermal ? '80mm' : '100%'} !important;
                max-width: ${isThermal ? '80mm' : '100%'} !important;
                background: #ffffff !important;
                display: block !important;
                position: static !important;
                overflow: visible !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .bill-paper-a4 {
                box-shadow: none !important;
                border: none !important;
                padding: 0 !important;
                margin: 0 auto !important;
                max-width: 100% !important;
                width: 100% !important;
              }
              .bill-paper-thermal {
                box-shadow: none !important;
                border: none !important;
                padding: 3mm 2mm !important;
                width: 76mm !important;
                max-width: 76mm !important;
                margin: 0 auto !important;
                height: auto !important;
                min-height: 0 !important;
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

  const totalQty = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return (
    <div className="bill-viewer-container">
      {showToolbar && (
        <div className={`bill-control-bar ${activeFormat === 'a4' ? 'a4-toolbar' : 'thermal-toolbar'}`}>
          <div className="bill-format-tabs">
            <button
              type="button"
              className={`bill-format-tab ${activeFormat === 'a4' ? 'active' : ''}`}
              onClick={() => setActiveFormat('a4')}
            >
              <FileTextOutlined /> A4 Tax Invoice
            </button>
            <button
              type="button"
              className={`bill-format-tab ${activeFormat === 'thermal' ? 'active' : ''}`}
              onClick={() => setActiveFormat('thermal')}
            >
              <BarcodeOutlined /> 80mm Thermal Slip
            </button>
          </div>

          <div className="bill-actions">
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              onClick={handlePrint}
            >
              Print {activeFormat === 'thermal' ? 'Thermal (80mm)' : 'A4 Bill'}
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

      {/* RENDER A4 BILL */}
      {activeFormat === 'a4' && (
        <div className="bill-paper-a4-wrapper">
          <div className="bill-paper-a4 bill-printable-area">
          <div className="bill-brand-header">
            <div className="bill-brand-left">
              <div className="bill-emblem">D</div>
              <div>
                <h1 className="bill-brand-title">{company.name}</h1>
                <p className="bill-brand-tagline">Machinery • Tools • Spares • Industrial Engineering</p>
              </div>
            </div>
            <div className="bill-brand-right">
              <h2 className="bill-doc-title">{invoice.gstEnabled ? 'TAX INVOICE' : 'RETAIL BILL'}</h2>
              <span className={`bill-status-pill status-${payStatus}`}>
                {payStatus.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="bill-meta-bar">
            <div>
              <div className="bill-meta-item-label">Invoice Number</div>
              <div className="bill-meta-item-val">#{invoice.number}/{invoice.year || ''}</div>
            </div>
            <div>
              <div className="bill-meta-item-label">Invoice Date</div>
              <div className="bill-meta-item-val">{dayjs(invoice.date).format('DD MMM YYYY')}</div>
            </div>
            <div>
              <div className="bill-meta-item-label">Due Date</div>
              <div className="bill-meta-item-val">{dayjs(invoice.expiredDate || invoice.date).format('DD MMM YYYY')}</div>
            </div>
            <div>
              <div className="bill-meta-item-label">Place of Supply</div>
              <div className="bill-meta-item-val">
                {invoice.buyerState || company.state} ({invoice.supplyType === 'interstate' ? 'Inter-state' : 'Intra-state'})
              </div>
            </div>
          </div>

          <div className="bill-parties-grid">
            <div className="bill-party-card">
              <div className="bill-party-header">Billed By (Supplier)</div>
              <div className="bill-party-name">{company.name}</div>
              <div className="bill-party-line">{company.address}</div>
              <div className="bill-party-line">{company.state}, {company.country}</div>
              {company.gstin && (
                <div className="bill-party-line"><strong>GSTIN:</strong> {company.gstin}</div>
              )}
              {company.phone && (
                <div className="bill-party-line"><strong>Phone:</strong> {company.phone}</div>
              )}
              {company.email && (
                <div className="bill-party-line"><strong>Email:</strong> {company.email}</div>
              )}
              {company.regNo && (
                <div className="bill-party-line"><strong>Reg No:</strong> {company.regNo}</div>
              )}
            </div>

            <div className="bill-party-card">
              <div className="bill-party-header">Billed To (Customer)</div>
              <div className="bill-party-name">{client.name || 'Valued Customer'}</div>
              {client.businessName && (
                <div className="bill-party-line"><strong>M/s:</strong> {client.businessName}</div>
              )}
              {client.address && (
                <div className="bill-party-line">{client.address}</div>
              )}
              {client.phone && (
                <div className="bill-party-line"><strong>Phone:</strong> {client.phone}</div>
              )}
              {client.email && (
                <div className="bill-party-line"><strong>Email:</strong> {client.email}</div>
              )}
              {(invoice.buyerGstin || client.gstin) && (
                <div className="bill-party-line"><strong>GSTIN:</strong> {invoice.buyerGstin || client.gstin}</div>
              )}
              {(invoice.buyerState || client.state) && (
                <div className="bill-party-line"><strong>State:</strong> {invoice.buyerState || client.state}</div>
              )}
            </div>
          </div>

          <div className="bill-table-wrapper">
            <table className="bill-main-table">
              <thead>
                <tr>
                  <th className="text-center" style={{ width: 32 }}>#</th>
                  <th>Machine / Item Details</th>
                  <th className="text-center" style={{ width: 70 }}>HSN/SAC</th>
                  <th className="text-center" style={{ width: 50 }}>Qty</th>
                  <th className="text-right" style={{ width: 85 }}>Rate</th>
                  <th className="text-right" style={{ width: 90 }}>Taxable</th>
                  {invoice.gstEnabled && (
                    <>
                      <th className="text-center" style={{ width: 55 }}>GST %</th>
                      {invoice.supplyType === 'intrastate' ? (
                        <>
                          <th className="text-right" style={{ width: 70 }}>CGST</th>
                          <th className="text-right" style={{ width: 70 }}>SGST</th>
                        </>
                      ) : (
                        <th className="text-right" style={{ width: 80 }}>IGST</th>
                      )}
                    </>
                  )}
                  <th className="text-right" style={{ width: 95 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item._id || idx}>
                    <td className="text-center">{idx + 1}</td>
                    <td>
                      <div className="bill-item-name">{item.itemName}</div>
                      {(item.sku || item.description) && (
                        <div className="bill-item-sub">
                          {item.sku ? `SKU: ${item.sku}` : ''} {item.description ? `· ${item.description}` : ''}
                        </div>
                      )}
                    </td>
                    <td className="text-center">{item.hsnCode || '-'}</td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-right">{moneyFormatter({ amount: item.price, currency_code: currency })}</td>
                    <td className="text-right">{moneyFormatter({ amount: item.taxableValue || item.total, currency_code: currency })}</td>
                    {invoice.gstEnabled && (
                      <>
                        <td className="text-center">{item.gstRate || 0}%</td>
                        {invoice.supplyType === 'intrastate' ? (
                          <>
                            <td className="text-right">{moneyFormatter({ amount: item.cgst || 0, currency_code: currency })}</td>
                            <td className="text-right">{moneyFormatter({ amount: item.sgst || 0, currency_code: currency })}</td>
                          </>
                        ) : (
                          <td className="text-right">{moneyFormatter({ amount: item.igst || 0, currency_code: currency })}</td>
                        )}
                      </>
                    )}
                    <td className="text-right" style={{ fontWeight: 700 }}>
                      {moneyFormatter({ amount: item.lineTotal || item.total, currency_code: currency })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bill-bottom-grid">
            <div className="bill-bottom-left">
              <div className="bill-words-card">
                <div className="bill-words-title">Amount in Words:</div>
                <div className="bill-words-text">{numberToWords(invoice.total)}</div>
              </div>

              <div className="bill-bank-card">
                <div className="bill-bank-title">Bank & Payment Details</div>
                <div className="bill-bank-line">{company.bank}</div>
                <div className="bill-bank-line">UPI: sales@dishamachinary (GPay / PhonePe / Paytm accepted)</div>
              </div>

              <div className="bill-terms-card">
                <strong>Terms & Conditions:</strong>
                <div>1. Warranty as per manufacturer terms. Physical & electrical damages not covered.</div>
                <div>2. Goods once sold will not be accepted back without authorized inspection.</div>
                <div>3. Subject to local state jurisdiction.</div>
              </div>
            </div>

            <div className="bill-bottom-right">
              <table className="bill-calc-table">
                <tbody>
                  <tr>
                    <td className="lbl">Sub Total:</td>
                    <td className="val">{moneyFormatter({ amount: invoice.subTotal, currency_code: currency })}</td>
                  </tr>
                  {invoice.discount > 0 && (
                    <tr>
                      <td className="lbl">Discount:</td>
                      <td className="val">- {moneyFormatter({ amount: invoice.discount, currency_code: currency })}</td>
                    </tr>
                  )}
                  {invoice.gstEnabled ? (
                    invoice.supplyType === 'intrastate' ? (
                      <>
                        <tr>
                          <td className="lbl">CGST:</td>
                          <td className="val">{moneyFormatter({ amount: invoice.cgstTotal, currency_code: currency })}</td>
                        </tr>
                        <tr>
                          <td className="lbl">SGST:</td>
                          <td className="val">{moneyFormatter({ amount: invoice.sgstTotal, currency_code: currency })}</td>
                        </tr>
                      </>
                    ) : (
                      <tr>
                        <td className="lbl">IGST:</td>
                        <td className="val">{moneyFormatter({ amount: invoice.igstTotal, currency_code: currency })}</td>
                      </tr>
                    )
                  ) : (
                    <tr>
                      <td className="lbl">GST:</td>
                      <td className="val text-muted">0.00 (Exempt / Nil)</td>
                    </tr>
                  )}
                  <tr className="bill-grand-total-row">
                    <td className="lbl">Grand Total:</td>
                    <td className="val">{moneyFormatter({ amount: invoice.total, currency_code: currency })}</td>
                  </tr>
                  {invoice.credit !== undefined && invoice.credit > 0 && (
                    <>
                      <tr>
                        <td className="lbl" style={{ color: '#15803d' }}>Amount Paid:</td>
                        <td className="val" style={{ color: '#15803d' }}>{moneyFormatter({ amount: invoice.credit, currency_code: currency })}</td>
                      </tr>
                      <tr>
                        <td className="lbl" style={{ color: '#b91c1c' }}>Balance Due:</td>
                        <td className="val" style={{ color: '#b91c1c' }}>{moneyFormatter({ amount: Math.max(0, invoice.total - invoice.credit), currency_code: currency })}</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bill-signatory-row">
            <div className="bill-sign-notice">
              Computer generated bill for Disha Machinary. Valid without physical signature.
            </div>
            <div className="bill-sign-box">
              <div className="bill-sign-company">For {company.name}</div>
              <div className="bill-sign-line">Authorized Signatory</div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* RENDER THERMAL 80MM BILL */}
      {activeFormat === 'thermal' && (
        <div className="bill-paper-thermal bill-printable-area">
          <div className="thermal-center">
            <div className="thermal-shop-name">{company.name}</div>
            <div className="thermal-shop-sub">MACHINERY • SPARES • TOOLS</div>
            <div className="thermal-shop-sub">{company.address}</div>
            {company.phone && <div className="thermal-shop-sub">Ph: {company.phone}</div>}
            {company.gstin && <div className="thermal-shop-sub thermal-bold">GSTIN: {company.gstin}</div>}
          </div>

          <div className="thermal-divider-double" />
          <div className="thermal-center">
            <div className="thermal-doc-title">
              {invoice.gstEnabled ? 'TAX INVOICE' : 'CASH / RETAIL RECEIPT'}
            </div>
          </div>

          <div className="thermal-meta-line">
            <span>Bill: #{invoice.number}/{invoice.year || ''}</span>
            <span>{dayjs(invoice.date).format('DD/MM/YY HH:mm')}</span>
          </div>

          <div className="thermal-meta-line">
            <span>Cust: {client.name || 'Walk-in Customer'}</span>
            {client.phone && <span>Ph: {client.phone}</span>}
          </div>

          {(invoice.buyerGstin || client.gstin) && (
            <div className="thermal-meta-line">
              <span>GSTIN: {invoice.buyerGstin || client.gstin}</span>
            </div>
          )}

          <div className="thermal-items-header">
            <span>Item Description</span>
            <span>Amount</span>
          </div>

          {items.map((item, idx) => (
            <div className="thermal-item-row" key={item._id || idx}>
              <div className="thermal-item-name">{item.itemName}</div>
              <div className="thermal-item-calc">
                <span>{item.quantity} x {moneyFormatter({ amount: item.price, currency_code: currency })}</span>
                <span className="thermal-bold">
                  {moneyFormatter({ amount: item.lineTotal || item.total, currency_code: currency })}
                </span>
              </div>
              {(item.hsnCode || (invoice.gstEnabled && item.gstRate)) && (
                <div className="thermal-item-gst-tag">
                  {item.hsnCode ? `HSN:${item.hsnCode} ` : ''}
                  {invoice.gstEnabled ? `GST:${item.gstRate || 0}%` : ''}
                </div>
              )}
            </div>
          ))}

          <div className="thermal-divider-single" />

          <div className="thermal-totals-area">
            <div className="thermal-total-line">
              <span>Sub Total:</span>
              <span>{moneyFormatter({ amount: invoice.subTotal, currency_code: currency })}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="thermal-total-line">
                <span>Discount:</span>
                <span>- {moneyFormatter({ amount: invoice.discount, currency_code: currency })}</span>
              </div>
            )}
            {invoice.gstEnabled && (
              invoice.supplyType === 'intrastate' ? (
                <>
                  <div className="thermal-total-line">
                    <span>CGST:</span>
                    <span>{moneyFormatter({ amount: invoice.cgstTotal, currency_code: currency })}</span>
                  </div>
                  <div className="thermal-total-line">
                    <span>SGST:</span>
                    <span>{moneyFormatter({ amount: invoice.sgstTotal, currency_code: currency })}</span>
                  </div>
                </>
              ) : (
                <div className="thermal-total-line">
                  <span>IGST:</span>
                  <span>{moneyFormatter({ amount: invoice.igstTotal, currency_code: currency })}</span>
                </div>
              )
            )}
            <div className="thermal-grand-total thermal-total-line">
              <span>NET PAYABLE:</span>
              <span>{moneyFormatter({ amount: invoice.total, currency_code: currency })}</span>
            </div>
            {invoice.credit !== undefined && invoice.credit > 0 && (
              <>
                <div className="thermal-total-line">
                  <span>Paid Amount:</span>
                  <span className="thermal-bold">{moneyFormatter({ amount: invoice.credit, currency_code: currency })}</span>
                </div>
                <div className="thermal-total-line">
                  <span>Balance Due:</span>
                  <span>{moneyFormatter({ amount: Math.max(0, invoice.total - invoice.credit), currency_code: currency })}</span>
                </div>
              </>
            )}
          </div>

          <div className="thermal-divider-single" />
          <div className="thermal-meta-line">
            <span>Total Items: {items.length}</span>
            <span>Total Qty: {totalQty}</span>
          </div>

          <div className="thermal-divider-double" />
          <div className="thermal-footer thermal-center">
            <div className="thermal-bold">* THANK YOU FOR YOUR BUSINESS *</div>
            <div>For Support: {company.phone}</div>
            <div>Goods once sold subject to warranty terms.</div>
            <div className="thermal-barcode">*DM-INV-{invoice.number}-{invoice.year}*</div>
            <div style={{ marginTop: 3 }}>*** DISHA MACHINARY ***</div>
          </div>
        </div>
      )}
    </div>
  );
}
