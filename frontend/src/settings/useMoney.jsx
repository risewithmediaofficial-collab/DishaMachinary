import { useSelector } from 'react-redux';
import storePersist from '@/redux/storePersist';

import { selectMoneyFormat } from '@/redux/settings/selectors';

const useMoney = () => {
  const money_format_settings = useSelector(selectMoneyFormat);

  const money_format_state = money_format_settings
    ? money_format_settings
    : storePersist.get('settings')?.money_format_settings;
  const currencySymbol = '₹';
  const currencyCode = 'INR';
  const currencyPosition = 'before';

  function currencyFormat({ amount, currency_code = money_format_state?.currency_code }) {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: money_format_state?.cent_precision ?? 2,
      maximumFractionDigits: money_format_state?.cent_precision ?? 2,
    }).format(Number(amount) || 0);
  }

  function moneyFormatter({ amount = 0, currency_code = currencyCode }) {
    const formattedAmount = currencyFormat({ amount, currency_code });
    return currencyPosition === 'after'
      ? `${formattedAmount} ${currencySymbol}`
      : `${currencySymbol} ${formattedAmount}`;
  }

  function amountFormatter({ amount = 0, currency_code = money_format_state?.currency_code }) {
    return currencyFormat({ amount: amount, currency_code });
  }

  function moneyRowFormatter({ amount = 0, currency_code = money_format_state?.currency_code }) {
    return {
      props: {
        style: {
          textAlign: 'right',
          whiteSpace: 'nowrap',
          direction: 'ltr',
        },
      },
      children: (
        <>
          {currencyPosition === 'after'
            ? `${currencyFormat({ amount, currency_code: currencyCode })} ${currencySymbol}`
            : `${currencySymbol} ${currencyFormat({ amount, currency_code: currencyCode })}`}
        </>
      ),
    };
  }

  return {
    moneyRowFormatter,
    moneyFormatter,
    amountFormatter,
    currency_symbol: currencySymbol,
    currency_code: currencyCode,
    currency_position: currencyPosition,
    decimal_sep: money_format_state?.decimal_sep,
    thousand_sep: money_format_state?.thousand_sep,
    cent_precision: money_format_state?.cent_precision,
    zero_format: money_format_state?.zero_format,
  };
};

export default useMoney;
