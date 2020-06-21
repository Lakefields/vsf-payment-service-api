const config = require('config')

const invoiceOrder = async (order_id) => {

  const Magento2Client = require('magento2-rest-client').Magento2Client
  const client = Magento2Client(config.magento2.api);
  client.addMethods('invoice', (restClient) => {
    let module: any = {};
    module.create = () => {
      return restClient.post('/order/'+ order_id + '/invoice', {
        "capture": false,
        "notify": true
      });
    };
    return module;
  })
  
  return client.invoice.create()
 
}

export default invoiceOrder