import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { settingsAction } from '@/redux/settings/actions';
import { selectSettings } from '@/redux/settings/selectors';

import { Button, Form, notification, Space } from 'antd';
import { SaveOutlined, CheckCircleOutlined } from '@ant-design/icons';
import Loading from '@/components/Loading';
import useLanguage from '@/locale/useLanguage';

export default function UpdateSettingForm({ config, children, withUpload, uploadSettingKey }) {
  let { entity, settingsCategory } = config;
  const dispatch = useDispatch();
  const { result, isLoading } = useSelector(selectSettings);
  const translate = useLanguage();
  const [form] = Form.useForm();

  const onSubmit = (fieldsValue) => {
    if (withUpload) {
      if (fieldsValue.file && fieldsValue.file[0]?.originFileObj) {
        fieldsValue.file = fieldsValue.file[0].originFileObj;
      } else {
        notification.error({
          message: translate('Please select a file to upload.'),
        });
        return;
      }
      dispatch(
        settingsAction.upload({ entity, settingKey: uploadSettingKey, jsonData: fieldsValue })
      );
    } else {
      const settings = [];

      for (const [key, value] of Object.entries(fieldsValue)) {
        settings.push({ settingKey: key, settingValue: value });
      }

      dispatch(settingsAction.updateMany({ entity, jsonData: { settings } }));
    }
  };

  useEffect(() => {
    const current = result[settingsCategory];
    if (current) {
      form.setFieldsValue(current);
    }
  }, [result, settingsCategory, form]);

  return (
    <div style={{ width: '100%' }}>
      <Loading isLoading={isLoading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onSubmit}
          requiredMark="optional"
          style={{ width: '100%' }}
        >
          <div style={{ marginBottom: 28 }}>
            {children}
          </div>

          <div
            style={{
              paddingTop: 20,
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={isLoading}
              style={{
                height: 42,
                padding: '0 28px',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 14,
                background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              }}
            >
              {translate('Save Changes') || 'Save Changes'}
            </Button>

            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              Changes take effect immediately across all active sessions
            </span>
          </div>
        </Form>
      </Loading>
    </div>
  );
}
