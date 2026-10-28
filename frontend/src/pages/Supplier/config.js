export const fields = {
  name: {
    type: 'string',
    label: 'Supplier / Ledger Name',
    required: true,
    placeholder: 'e.g. Sri Lakshmi Machinery Supplies',
  },
  company: {
    type: 'string',
    label: 'Company / Firm Name',
    placeholder: 'e.g. Lakshmi Machine Tools Pvt Ltd',
  },
  phone: {
    type: 'phone',
    label: 'Mobile No / Phone',
    required: true,
    placeholder: 'e.g. 9876543210',
  },
  email: {
    type: 'email',
    label: 'Email ID',
    placeholder: 'supplier@example.com',
  },
  gstin: {
    type: 'string',
    label: 'GST Number',
    placeholder: 'e.g. 33AAAAA0000A1Z5',
  },
  panNumber: {
    type: 'string',
    label: 'PAN Number',
    placeholder: 'e.g. ABCDE1234F',
  },
  address: {
    type: 'string',
    label: 'Address',
    placeholder: 'Street address, factory or shop number',
  },
  city: {
    type: 'string',
    label: 'Area / City',
    placeholder: 'e.g. Tirupattur, Chennai, Coimbatore',
  },
  state: {
    type: 'string',
    label: 'State',
    defaultValue: 'Tamil Nadu',
    required: true,
  },
  pincode: {
    type: 'string',
    label: 'Pincode',
    placeholder: '635601',
  },
  cstNo: {
    type: 'string',
    label: 'CST No',
  },
  dlNo1: {
    type: 'string',
    label: 'DL No 1',
  },
  dlNo2: {
    type: 'string',
    label: 'DL No 2',
  },
  openingBalance: {
    type: 'currency',
    label: 'Opening Outstanding (₹)',
  },
  creditLimit: {
    type: 'currency',
    label: 'Credit Limit (₹)',
  },
  bankName: {
    type: 'string',
    label: 'Bank Name',
    placeholder: 'e.g. Federal Bank, State Bank of India',
  },
  bankAccount: {
    type: 'string',
    label: 'Bank Account Number',
    placeholder: 'e.g. 20695500000537',
  },
  bankIfsc: {
    type: 'string',
    label: 'Bank IFSC Code',
    placeholder: 'e.g. FDRL0002069',
  },
  bankBranch: {
    type: 'string',
    label: 'Bank Branch',
    placeholder: 'e.g. Tirupathur',
  },
  notes: {
    type: 'textarea',
    label: 'Notes / Remarks',
  },
};
