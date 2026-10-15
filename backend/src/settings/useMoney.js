const useMoney = ({ settings }) => {
  const {
    currency_symbol,
    currency_position,
    decimal_sep,
    thousand_sep,
    cent_precision,
    zero_format,
  } = settings;

  function currencyFormat(amount) {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: cent_precision ?? 2,
      maximumFractionDigits: cent_precision ?? 2,
    }).format(Number(amount) || 0);
  }

  function moneyFormatter({ amount = 0 }) {
    return '₹ ' + currencyFormat(amount);
  }

  function amountFormatter({ amount = 0 }) {
    return currencyFormat(amount);
  }

  return {
    moneyFormatter,
    amountFormatter,
    currency_symbol: '₹',
    currency_position: 'before',
    decimal_sep,
    thousand_sep,
    cent_precision,
    zero_format,
  };
};

module.exports = useMoney;
