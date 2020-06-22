import { apiStatus, apiError } from '../../../../lib/util'
import createPaymentToken from '../backendSystem/PaymentToken/Create';

const Token = module.exports = ({config, db}) => async function (req, res, body) {

  let cart_id = req.body.cart_id

  try {

    if (!(req.method === 'POST' || req.method === 'OPTIONS')) {
      throw new Error('ERROR: ' + req.method + ' request method is not supported.')      
    }
    if (!cart_id || cart_id === '') {
      throw new Error('ERROR: no cart_id provided')      
    }

    const paymentToken = await createPaymentToken(cart_id)
    console.log('paymentToken', paymentToken)
    apiStatus(res, paymentToken, 200);
  } catch (error) {
    console.log(error.message)
    apiError(res, error.message);
  }

}

export default Token
