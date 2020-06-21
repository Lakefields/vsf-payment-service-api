const config = require('config')

const cancelOrder = async (order_id) => {

  const Magento2Client = require('magento2-rest-client').Magento2Client
  const client = Magento2Client(config.magento2.api);
  client.addMethods('order', (restClient) => {
    let module: any = {};
    module.cancel = () => {
      return restClient.post('/orders/'+ order_id + '/cancel');
    };
    return module;
  })

  return client.order.cancel()
 
}

export default cancelOrder