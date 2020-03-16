import { apiStatus, apiError } from '../../../../lib/util'
import prepareOrder from './create/prepareOrder'
import orderComment from '../backendSystem/orderComment'
import getBackendOrder from '../backendSystem/getBackendOrder';
import Order from './create/Order';

const Orders = module.exports = ({config, db}) => async (req, res) => {

  const params = req.body

  try {

    if (!(req.method === 'POST' || req.method === 'OPTIONS')) {
      throw new Error('ERROR: ' + req.method + ' request method is not supported.')      
    }
    //get backendOrder details
    const backendOrder = await getBackendOrder(params.order_id)

    //prepare params for creating order at Psp
    const createPspOrderParams = prepareOrder(backendOrder, params);
    const pspOrder = await Order(createPspOrderParams)

    //collect orderComment data
    const orderCommentData = {
      order_id: backendOrder.entity_id,
      order_comment: 'Payment is created for amount ' + Object.values(createPspOrderParams.amount).reverse().join(' '),
      status: 'pending_payment'
    }
    const postOrderComment = await orderComment(orderCommentData)
    const setCheckoutUrl = pspOrder._links.checkout.href
    console.log(setCheckoutUrl)
    apiStatus(res, setCheckoutUrl, 200);

  } catch (error) {
    console.warn(error);
    //collect orderComment data
    const orderCommentData = {
      order_id: params.order_id,
      order_comment: 'Payment could not be created: ' + error.message,
      status: 'canceled'
    }
    const postOrderComment = await orderComment(orderCommentData)
    apiError(res, error);
  }

}
export default Orders