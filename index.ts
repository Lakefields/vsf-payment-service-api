import { Router } from 'express';
import createOrder from './createOrder';
import paymentMethods from './paymentMethods';
module.exports = ({ config, db }) => {
  let api = Router();

  // mount the createOrder resource
  api.use('/create-order', createOrder({ config, db }))

  // mount the createOrder resource
  api.use('/payment-methods', paymentMethods({ config, db }))

  // perhaps expose some API metadata at the root
  api.get('/', (req, res) => {
    res.json('Mollie Orders API for Vue Storefront');
  });
  return api;
}
