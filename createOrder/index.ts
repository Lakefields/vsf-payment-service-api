import { apiStatus, apiError } from '../../../../lib/util'
import prepareOrder from './prepareOrder'
import orderComment from '../orderComment'
import createMollieClient, { Order } from '@mollie/api-client';

const createOrder = module.exports = ({config, db}) => function (req, res) {

  try {

    if (!(req.method === 'POST' || req.method === 'OPTIONS')) {
      throw new Error('ERROR: ' + req.method + ' request method is not supported.')
    }

    const Magento2Client = require('magento2-rest-client').Magento2Client
    const mollieClientKey = config.extensions.mollie.api_key
    const mollieClient = createMollieClient({ apiKey: mollieClientKey });

    const params = req.body
    params.paymentServiceConfig = config.extensions.mollie
    params.algorithm = 'aes-256-cbc'

    const client = Magento2Client(config.magento2.api);
    client.addMethods('order', function (restClient) {
      let module: any = {};
      module.getSingleOrder = function () {
        return restClient.get('/orders/' + params.order_id);
      }
      return module;
    })

    client.order.getSingleOrder().then((backendOrder) => {
      const createOrderParams = prepareOrder(backendOrder, params);
      (async () => {
        try {
          const orderPsp: Order = await mollieClient.orders.create(createOrderParams);
          const postOrderComment = await orderComment({order_id: backendOrder.entity_id, order_comment: 'testing', status: "pending_payment" })
          console.log(postOrderComment)
          apiStatus(res, orderPsp, 200);
        } catch (error) {
          console.warn(error);
          apiError(res,error)
        }
      })();
    }).catch(err => {
      console.warn(err)
      apiError(res, err);
    })
  } catch (error) {
    console.warn(error);
    apiError(res, error);
  }

}
export default createOrder