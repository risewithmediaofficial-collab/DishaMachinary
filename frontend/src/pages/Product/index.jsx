import { Tag } from 'antd';
import CrudModule from '@/modules/CrudModule/CrudModule';
import DynamicForm from '@/forms/DynamicForm';
import useLanguage from '@/locale/useLanguage';
import { useMoney } from '@/settings';
import { fields } from './config';

export default function Product() {
  const translate = useLanguage();
  const { moneyFormatter } = useMoney();
  const entity = 'product';
  const searchConfig = { searchFields: 'name,sku,modelNumber,barcode' };
  const deleteModalLabels = ['name', 'sku'];
  const createFields = {
    ...fields,
    openingStock: { type: 'number', label: 'Opening Stock' },
  };

  const config = {
    entity,
    PANEL_TITLE: 'Products',
    DATATABLE_TITLE: 'Product Catalog',
    ADD_NEW_ENTITY: 'Add Product',
    ENTITY_NAME: 'Product',
    fields,
    interactiveBooleanFields: ['enabled', 'trackInventory', 'serialTracking', 'taxInclusive'],
    searchConfig,
    deleteModalLabels,
    dataTableColumns: [
      { title: translate('Product'), dataIndex: 'name' },
      { title: 'SKU', dataIndex: 'sku' },
      { title: 'Model', dataIndex: 'modelNumber' },
      { title: 'Category', dataIndex: 'category' },
      { title: 'HSN / SAC', dataIndex: 'hsnCode' },
      {
        title: 'Selling Price',
        dataIndex: 'sellingPrice',
        render: (amount) => moneyFormatter({ amount }),
      },
      { title: 'GST', dataIndex: 'gstRate', render: (rate) => `${rate || 0}%` },
      {
        title: 'Stock',
        dataIndex: 'stockQuantity',
        render: (quantity, product) => {
          const available = Number(quantity || 0) - Number(product.reservedQuantity || 0);
          const lowStock = product.trackInventory && available <= product.reorderLevel;
          return <Tag color={lowStock ? 'red' : 'green'}>{`${available} available / ${quantity} on hand ${product.unit}`}</Tag>;
        },
      },
    ],
  };

  return (
    <CrudModule
      createForm={<DynamicForm fields={createFields} />}
      updateForm={<DynamicForm fields={fields} />}
      config={config}
    />
  );
}
