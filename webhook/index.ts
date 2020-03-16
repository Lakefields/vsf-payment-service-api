import { apiStatus, apiError } from '../../../../lib/util'
import getOrder from '../Orders/get/Order'

const webhook = module.exports = ({config, db}) => async (req, res) => {

  const params = req.body
  console.log(params)

  try {

    if (!(req.method === 'POST' || req.method === 'OPTIONS')) {
      throw new Error(req.method + ' request method is not supported.')      
    }

    const pspOrder = await getOrder(params.id)
    apiStatus(res, pspOrder, 200);


  } catch (error) {
    apiError(res, error);
  }

}
export default webhook