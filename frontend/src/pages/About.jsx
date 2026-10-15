import { Result } from 'antd';

import useLanguage from '@/locale/useLanguage';

const About = () => {
  const translate = useLanguage();
  return (
    <Result
      status="info"
      title="Disha Machinary"
      subTitle={translate('Do you need help on customize of this app')}
      extra={<p>Disha Machinary ERP / CRM</p>}
    />
  );
};

export default About;
