const config = require('config')
import createMollieClient, { Order } from '@mollie/api-client';

export default async (orderData: any) => {

  const mollieClientKey = config.extensions.mollie.api_key
  const mollieClient = createMollieClient({ apiKey: mollieClientKey })

  return mollieClient.orders.create(orderData)

}