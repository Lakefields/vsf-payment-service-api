import { apiStatus } from '../../../../lib/util'
import createMollieClient, { List, Method, MethodInclude, Locale } from '@mollie/api-client';

const paymentMethods = module.exports = ({config, db}) => async function (req, res, body) {

  const mollieClientKey = config.extensions.mollie.api_key
  const mollieClient = createMollieClient({ apiKey: mollieClientKey });
  let resource: string = "orders";

  try {
    const methods: List<Method> = await mollieClient.methods.list({
      resource: resource,
      include: MethodInclude.issuers,
      locale: Locale.nl_NL
    });
    apiStatus(res, methods, 200);
  } catch (error) {
    apiStatus(res, error, 500);
  }

}

export default paymentMethods