const config = require('config')
import createMollieClient, { Order } from '@mollie/api-client';

const getOrder = async (order_id: any) => {

    const mollieClientKey = config.extensions.mollie.api_key
    const mollieClient = createMollieClient({ apiKey: mollieClientKey });

    try {
      const order: Order = await mollieClient.orders.get(order_id);
      return order
    } catch (error) {
      console.warn(error);
    }

}

export default getOrder