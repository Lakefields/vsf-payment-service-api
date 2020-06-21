import { apiStatus, apiError } from '../../../../lib/util'
import crypto from "crypto";
import getBackendOrder from '../backendSystem/Order/Get';

const Status = module.exports = ({config, db}) => async function (req, res, body) {

  let sectret_key = config.extensions.mollie.secret
  let algorithm = config.extensions.mollie.algorithm
  let token = req.body.token

  try {

    if (!(req.method === 'POST' || req.method === 'OPTIONS')) {
      throw new Error('ERROR: ' + req.method + ' request method is not supported.')      
    }
    if (!token || token === '') {
      throw new Error('ERROR: no token provided')      
    }

    let decipher = crypto.createDecipher(algorithm,sectret_key)
    let decrypted = decipher.update(token,'hex','utf8')
    decrypted += decipher.final('utf8');

    const backendOrderId = decrypted.split('-')[0];
    const backendOrder = await getBackendOrder(backendOrderId)

    const result = {
      'payment': {
        'status': (backendOrder.payment.amount_ordered === backendOrder.payment.amount_paid) === true ? 'paid' : 'pending'
      },
      'order': {
        'increment_id': backendOrder.increment_id,
        'customer_email': backendOrder.customer_email
      }
    }
    apiStatus(res, result, 200);
  } catch (error) {
    console.log(error.message)
    apiError(res, error.message);
  }

}

export default Status
