const grants = {
  owner: ['*'],
  admin: ['*'],
  billing: ['sales.create', 'sales.read', 'payments.create', 'customers.manage'],
  inventory: ['inventory.read', 'inventory.adjust', 'products.manage'],
  accountant: ['sales.read', 'payments.create', 'payments.reverse', 'expenses.manage', 'reports.read', 'reports.export'],
  service: ['inventory.read', 'service.manage'],
};

const can = (role, permission) => {
  const permissions = grants[role] || [];
  return permissions.includes('*') || permissions.includes(permission);
};

const requirePermission = (permission) => (req, res, next) => {
  if (req.admin && can(req.admin.role, permission)) return next();
  return res.status(403).json({
    success: false,
    result: null,
    message: `You do not have permission to perform this action (${permission})`,
  });
};

module.exports = { can, requirePermission };
