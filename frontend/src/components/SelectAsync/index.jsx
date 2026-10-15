import { useState, useEffect } from 'react';
import { request } from '@/request';
import useFetch from '@/hooks/useFetch';
import { Select, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { generate as uniqueId } from '@/utils/uniqueId';
import color from '@/utils/color';
import useLanguage from '@/locale/useLanguage';

const SelectAsync = ({
  entity,
  displayLabels = ['name'],
  outputValue = '_id',
  redirectLabel = '',
  withRedirect = false,
  urlToRedirect = '/',
  placeholder = 'Select',
  value,
  onChange,
  style = {},
  ...rest
}) => {
  const translate = useLanguage();
  const [selectOptions, setOptions] = useState([]);
  const [currentValue, setCurrentValue] = useState(undefined);

  const navigate = useNavigate();

  const asyncList = () => {
    return request.list({ entity });
  };
  const { result, isLoading: fetchIsLoading, isSuccess } = useFetch(asyncList);

  useEffect(() => {
    if (isSuccess) setOptions(Array.isArray(result) ? result : []);
  }, [isSuccess, result]);

  useEffect(() => {
    if (value !== undefined) {
      const val = value?.[outputValue] ?? value;
      setCurrentValue(val);
      if (onChange) onChange(val);
    }
  }, [value]);

  const handleSelectChange = (newValue) => {
    if (newValue === 'redirectURL') {
      navigate(urlToRedirect);
    } else {
      const val = newValue?.[outputValue] ?? newValue;
      setCurrentValue(newValue);
      if (onChange) onChange(val);
    }
  };

  const optionsList = () => {
    const list = [];

    selectOptions.forEach((optionField) => {
      const optionVal = optionField[outputValue] ?? optionField;
      const primaryName = optionField.name || optionField[displayLabels[0]] || '';
      const code =
        optionField.sku ||
        optionField.code ||
        optionField.barcode ||
        (displayLabels.length > 1 && optionField[displayLabels[1]]);

      const labelText = code ? `${primaryName} · ${code}` : primaryName;
      const currentColor = optionField[outputValue]?.color ?? optionField?.color;
      const labelColor = color.find((x) => x.color === currentColor);

      list.push({
        value: optionVal,
        name: primaryName,
        code: code || '',
        label: labelText,
        color: labelColor?.color,
      });
    });

    return list;
  };

  return (
    <Select
      loading={fetchIsLoading}
      disabled={fetchIsLoading}
      value={currentValue}
      onChange={handleSelectChange}
      placeholder={placeholder}
      showSearch
      optionLabelProp="label"
      popupMatchSelectWidth={false}
      dropdownMatchSelectWidth={false}
      popupStyle={{ minWidth: 380, maxWidth: 650 }}
      dropdownStyle={{ minWidth: 380, maxWidth: 650 }}
      filterOption={(input, option) => {
        const text = (option?.label || option?.value || '').toString().toLowerCase();
        return text.includes(input.toLowerCase());
      }}
      style={{ minWidth: 260, ...style }}
      {...rest}
    >
      {optionsList()?.map((option) => (
        <Select.Option
          key={option.value || uniqueId()}
          value={option.value}
          label={option.label}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              padding: '2px 0',
              width: '100%',
            }}
          >
            <span style={{ fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>
              {option.name}
            </span>
            {option.code ? (
              <Tag
                color="blue"
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: 11,
                  borderRadius: 4,
                  letterSpacing: '0.3px',
                }}
              >
                {option.code}
              </Tag>
            ) : option.color ? (
              <Tag bordered={false} color={option.color}>
                {option.name}
              </Tag>
            ) : null}
          </div>
        </Select.Option>
      ))}
      {withRedirect && (
        <Select.Option value={'redirectURL'}>{`+ ` + translate(redirectLabel)}</Select.Option>
      )}
    </Select>
  );
};

export default SelectAsync;
