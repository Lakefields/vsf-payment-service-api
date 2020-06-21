import { apiStatus, apiError } from '../../../../lib/util'
import getOrder from '../Orders/get/Order'
import getBackendOrder from '../backendSystem/Order/Get';
import cancelOrder from '../backendSystem/Order/Cancel';
import invoiceOrder from '../backendSystem/Order/Invoice';

const Webhook = module.exports = ({config, db}) => async (req, res) => {

  const params = req.body

  try {

    if (!(req.method === 'POST' || req.method === 'OPTIONS')) {
      throw new Error(req.method + ' request method is not supported.')      
    }

    if(!params.hasOwnProperty('id') && !params.id) {
      throw new Error('No id present in webhook call')      
    }

    const pspOrder = await getOrder(params.id)
    if(!pspOrder) {
      throw new Error('No order found at PSP')
    }
    const backendOrderId = pspOrder.metadata.order_id
    const backendOrder = await getBackendOrder(backendOrderId)
    if(!backendOrder || backendOrder.state !== 'new') {
      throw new Error('This order is either not found or already processed')
    }
    const isPaid = pspOrder.isPaid() || pspOrder.isAuthorized()
    if(isPaid === true){
      const invoiceBackendOrder = await invoiceOrder(backendOrderId)
      if(!invoiceBackendOrder) {
        throw new Error('Error by invoice generation for order in backendsystem')
      }
    } else {
      const cancelBackendOrder = await cancelOrder(backendOrderId)
      if(!cancelBackendOrder) {
        throw new Error('Error by cancelling order in backendsystem')
      }
    }
    apiStatus(res, isPaid, 200)

  } catch (error) {
    apiError(res, error.message);
  }

}
export default Webhook