const config = require('config')

const getBackendOrder = async (order_id) => {

  const Magento2Client = require('magento2-rest-client').Magento2Client
  const client = Magento2Client(config.magento2.api);
  client.addMethods('order', function (restClient) {
    let module: any = {};
    module.getSingleOrder = function () {
      return restClient.get('/orders/' + order_id);
    }
    return module;
  })

  return client.order.getSingleOrder()
 
}

export default getBackendOrder