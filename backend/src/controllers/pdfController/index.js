const pug = require('pug');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const puppeteer = require('puppeteer');
const { listAllSettings, loadSettings } = require('@/middlewares/settings');
const { getData } = require('@/middlewares/serverData');
const useLanguage = require('@/locale/useLanguage');
const { useMoney, useDate } = require('@/settings');

const pugFiles = ['invoice', 'offer', 'quote', 'payment'];

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

function numberToWords(num) {
  if (typeof num !== 'number' || isNaN(num) || num <= 0) return 'Zero Rupees Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
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

exports.numberToWords = numberToWords;

exports.generatePdf = async (
  modelName,
  info = { filename: 'pdf_file', format: 'A4', targetLocation: '', isThermal: false },
  result,
  callback
) => {
  let browser;
  try {
    const { targetLocation } = info;
    const isThermal = Boolean(info.isThermal || info.format === 'thermal');

    // Ensure target directory exists
    if (targetLocation) {
      fs.mkdirSync(path.dirname(targetLocation), { recursive: true });
      if (fs.existsSync(targetLocation)) {
        fs.unlinkSync(targetLocation);
      }
    }

    if (pugFiles.includes(modelName.toLowerCase())) {
      const settings = (await loadSettings()) || {};
      const selectedLang = settings['idurar_app_language'];
      const translate = useLanguage({ selectedLang });

      // Disha Machinery branding defaults
      if (!settings.company_name || settings.company_name === 'COMPANY Name') {
        settings.company_name = 'DISHA MACHINERY';
      }
      if (!settings.company_tagline) {
        settings.company_tagline = '[ All Kinds of Machinery, All Kinds of Welding & Wiring Equipment and foods ]';
      }
      if (!settings.company_address || settings.company_address.includes('Your Company Address') || settings.company_address.includes('Plot No. 12')) {
        settings.company_address = 'Annamalai Complex, New Busstand, Tirupattur Dist - 635601';
      }
      if (!settings.company_phone || settings.company_phone.includes('345234654') || settings.company_phone.includes('+91 98765')) {
        settings.company_phone = '9751117889 / 9626957000 / 04179-2266666 / 294650';
      }
      if (!settings.company_email || settings.company_email.includes('example.com')) {
        settings.company_email = 'dishamachinery@gmail.com';
      }
      if (!settings.company_website || settings.company_website.includes('example.com')) {
        settings.company_website = 'www.dishamachinary.com';
      }
      if (!settings.company_gstin || settings.company_gstin === '33AABCD1234E1Z9') {
        settings.company_gstin = '33GPNPS1888N1ZT';
      }
      if (!settings.company_state) {
        settings.company_state = 'Tamil Nadu';
      }
      if (!settings.company_country) {
        settings.company_country = 'India';
      }
      if (!settings.company_reg_number || settings.company_reg_number.includes('00001231421') || settings.company_reg_number.includes('DM/IND')) {
        settings.company_reg_number = 'DM/26-27';
      }
      if (!settings.company_bank_name) {
        settings.company_bank_name = 'FEDERAL BANK';
      }
      if (!settings.company_bank_account || settings.company_bank_account.includes('iban :') || settings.company_bank_account.includes('HDFC')) {
        settings.company_bank_account = '20695500000537';
      }
      if (!settings.company_bank_ifsc) {
        settings.company_bank_ifsc = 'FDRL0002069';
      }
      if (!settings.company_bank_branch) {
        settings.company_bank_branch = 'TIRUPATHUR';
      }
      if (!settings.company_upi) {
        settings.company_upi = '9751117889@federal';
      }

      const {
        currency_symbol,
        currency_position,
        decimal_sep,
        thousand_sep,
        cent_precision,
        zero_format,
      } = settings;

      const { moneyFormatter } = useMoney({
        settings: {
          currency_symbol,
          currency_position,
          decimal_sep,
          thousand_sep,
          cent_precision,
          zero_format,
        },
      });
      const { dateFormat } = useDate({ settings });

      settings.public_server_file = process.env.PUBLIC_SERVER_FILE;

      const templateName = isThermal && modelName.toLowerCase() === 'invoice' ? 'InvoiceThermal' : modelName;
      const templatePath = path.join(__dirname, '../../pdf', `${templateName}.pug`);

      const htmlContent = pug.renderFile(templatePath, {
        model: result,
        settings,
        translate,
        dateFormat,
        moneyFormatter,
        moment: moment,
        numberToWords,
        isThermal,
      });

      const executablePath =
        process.env.PUPPETEER_EXECUTABLE_PATH ||
        (puppeteer.executablePath ? puppeteer.executablePath() : undefined);

      browser = await puppeteer.launch({
        headless: 'new',
        executablePath: executablePath || undefined,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      if (isThermal) {
        await page.pdf({
          path: targetLocation,
          width: '80mm',
          printBackground: true,
          margin: {
            top: '3mm',
            right: '3mm',
            bottom: '6mm',
            left: '3mm',
          },
        });
      } else {
        await page.pdf({
          path: targetLocation,
          format: 'A4',
          landscape: false,
          printBackground: true,
          margin: {
            top: '6mm',
            right: '8mm',
            bottom: '6mm',
            left: '8mm',
          },
        });
      }

      if (callback) await callback();
    }
  } catch (error) {
    throw new Error(error);
  } finally {
    if (browser) await browser.close();
  }
};
