const express = require('express');
const { catchErrors } = require('@/handlers/errorHandlers');
const router = express.Router();

const appControllers = require('@/controllers/appControllers');
const dashboardController = require('@/controllers/dashboardController');
const { routesList } = require('@/models/utils');
const { requirePermission } = require('@/middlewares/permissions');

const routerApp = (entity, controller) => {
  const createPermission = ['invoice', 'quote', 'payment'].includes(entity)
    ? requirePermission(entity === 'payment' ? 'payments.create' : 'sales.create')
    : entity === 'expense'
      ? requirePermission('expenses.manage')
    : entity === 'product'
      ? requirePermission('products.manage')
      : (req, res, next) => next();
  const updatePermission = entity === 'product'
    ? requirePermission('products.manage')
    : entity === 'expense'
      ? requirePermission('expenses.manage')
    : ['invoice', 'quote'].includes(entity)
      ? requirePermission('sales.create')
      : (req, res, next) => next();
  const deletePermission = entity === 'payment'
    ? requirePermission('payments.reverse')
    : entity === 'invoice'
      ? requirePermission('payments.reverse')
      : entity === 'expense'
        ? requirePermission('expenses.manage')
      : entity === 'product'
        ? requirePermission('products.manage')
        : (req, res, next) => next();

  router.route(`/${entity}/create`).post(createPermission, catchErrors(controller['create']));
  router.route(`/${entity}/read/:id`).get(catchErrors(controller['read']));
  router.route(`/${entity}/update/:id`).patch(updatePermission, catchErrors(controller['update']));
  router.route(`/${entity}/delete/:id`).delete(deletePermission, catchErrors(controller['delete']));
  router.route(`/${entity}/search`).get(catchErrors(controller['search']));
  router.route(`/${entity}/list`).get(catchErrors(controller['list']));
  router.route(`/${entity}/listAll`).get(catchErrors(controller['listAll']));
  router.route(`/${entity}/filter`).get(catchErrors(controller['filter']));
  router.route(`/${entity}/summary`).get(catchErrors(controller['summary']));

  if (entity === 'invoice' || entity === 'quote' || entity === 'payment') {
    router.route(`/${entity}/mail`).post(catchErrors(controller['mail']));
  }

  if (entity === 'invoice') {
    router.route('/invoice/reverse/:id').post(requirePermission('payments.reverse'), catchErrors(controller['reverse']));
  }

  if (entity === 'quote') {
    router.route(`/${entity}/convert/:id`).get(catchErrors(controller['convert']));
  }

  if (entity === 'product') {
    router.route('/product/adjust-stock').post(requirePermission('inventory.adjust'), catchErrors(controller['adjustStock']));
    router.route('/product/:id/stock-movements').get(catchErrors(controller['stockMovements']));
  }
};

router.route('/dashboard/summary').get(catchErrors(dashboardController.summary));

routesList.forEach(({ entity, controllerName }) => {
  const controller = appControllers[controllerName];
  routerApp(entity, controller);
});

module.exports = router;
