const config = require('config')
import createMollieClient, { Order } from '@mollie/api-client';

export default async (order_id: any) => {

    const mollieClientKey = config.extensions.mollie.api_key
    const mollieClient = createMollieClient({ apiKey: mollieClientKey });

    return mollieClient.orders.get(order_id);    

}