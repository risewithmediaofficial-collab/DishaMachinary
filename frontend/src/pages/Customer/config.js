export const fields = {
  name: {
    type: 'string',
  },
  businessName: { type: 'string', label: 'Business Name' },
  country: {
    type: 'country',
    // color: 'red',
  },
  state: {
    type: 'string',
    required: true,
  },
  gstin: {
    type: 'string',
    label: 'GSTIN',
  },
  address: {
    type: 'string',
  },
  phone: {
    type: 'phone',
  },
  email: {
    type: 'email',
  },
  paymentTermsDays: { type: 'number', label: 'Payment Terms (days)' },
  creditLimit: { type: 'currency', label: 'Credit Limit' },
  openingBalance: { type: 'currency', label: 'Opening Outstanding / Advance' },
  notes: { type: 'textarea' },
};
