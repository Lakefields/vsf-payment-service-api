import { Router } from 'express';
import Orders from './Orders';
import Methods from './Methods';
import Status from './Status';
import Token from './Token';
import Transaction from './Transaction';
import Webhook from './Webhook';
import bodyParser from 'body-parser';

module.exports = ({ config, db }) => {
  let api = Router();

  api.use(bodyParser.urlencoded({ extended: true }));

  // mount the Orders resource
  api.use('/order', Orders({ config, db }))

  // mount the Methods resource
  api.use('/methods', Methods({ config, db }))

  // mount the Status resource
  api.use('/status', Status({ config, db }))

  // mount the PaymentToken resource
  api.use('/token', Token({ config, db }))

  // mount the Transaction resource
  api.use('/transaction', Transaction({ config, db }))

  // mount the Webhook resource
  api.use('/webhook', Webhook({ config, db }))

  // perhaps expose some API metadata at the root
  api.get('/', (req, res) => {
    res.json('Mollie Orders API for Vue Storefront');
  });
  return api;
}
