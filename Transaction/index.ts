import { apiStatus, apiError } from '../../../../lib/util'
import startTransaction from '../backendSystem/Transaction/Start';

const Transaction = module.exports = ({config, db}) => async function (req, res, body) {

  // let token = req.body.token
  let token = 'jOc4VyBf7X0qOz92vLZ7xo1OwERijmZS'

  try {

    // if (!(req.method === 'POST' || req.method === 'OPTIONS')) {
    //   throw new Error('ERROR: ' + req.method + ' request method is not supported.')      
    // }
    if (!token || token === '') {
      throw new Error('ERROR: no token provided')      
    }

    const transactionData = await startTransaction(token)
    console.log('(!transactionData)', (!transactionData))
    if (!transactionData) {
      throw new Error('ERROR: no transaction available')      
    }
    console.log('transactionData', transactionData)
    apiStatus(res, transactionData, 200);
  } catch (error) {
    apiError(res, error);
  }

}

export default Transaction
