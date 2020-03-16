import { Router } from 'express';
import Orders from './Orders';
import Methods from './Methods';
import webhook from './webhook';
import bodyParser from 'body-parser';

module.exports = ({ config, db }) => {
  let api = Router();

  api.use(bodyParser.urlencoded({ extended: true }));

  // mount the createOrder resource
  api.use('/order', Orders({ config, db }))

  // mount the createOrder resource
  api.use('/methods', Methods({ config, db }))

  // mount the webhook resource
  api.use('/webhook', webhook({ config, db }))

  // perhaps expose some API metadata at the root
  api.get('/', (req, res) => {
    res.json('Mollie Orders API for Vue Storefront');
  });
  return api;
}
