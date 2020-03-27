import { Router } from 'express';
import Orders from './Orders';
import Methods from './Methods';
import Webhook from './Webhook';
import bodyParser from 'body-parser';

module.exports = ({ config, db }) => {
  let api = Router();

  api.use(bodyParser.urlencoded({ extended: true }));

  // mount the Orders resource
  api.use('/order', Orders({ config, db }))

  // mount the Methods resource
  api.use('/methods', Methods({ config, db }))

  // mount the Webhook resource
  api.use('/webhook', Webhook({ config, db }))

  // perhaps expose some API metadata at the root
  api.get('/', (req, res) => {
    res.json('Mollie Orders API for Vue Storefront');
  });
  return api;
}
