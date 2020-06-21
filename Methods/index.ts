import { apiStatus, apiError } from '../../../../lib/util'
import createMollieClient, { List, Method, MethodInclude, Locale } from '@mollie/api-client';

const Methods = module.exports = ({config, db}) => async function (req, res, body) {

  try {

    if (!(req.method === 'POST' || req.method === 'OPTIONS')) {
      throw new Error('ERROR: ' + req.method + ' request method is not supported.')      
    }

    const params = req.body
    const mollieClientKey = config.extensions.mollie.api_key
    const mollieClient = createMollieClient({ apiKey: mollieClientKey });
    let resource: string = "orders";
    let amount = params.amount
    let locale: string = params.locale

    console.log(amount)
  
    const methods: List<Method> = await mollieClient.methods.list({
      resource: resource,
      include: MethodInclude.issuers,
      locale: Locale[locale],
      amount: amount
    });
    console.log(methods)
    apiStatus(res, methods, 200);
  } catch (error) {
    console.log(error)
    apiError(res, error);
  }

}

export default Methods