const config = require('config')

const startTransaction = async (token) => {

  const Magento2Client = require('magento2-rest-client').Magento2Client
  const client = Magento2Client(config.magento2.api);
  client.addMethods('Mollie', function (restClient) {
    let module: any = {};
    module.startTransaction = function () {
      return restClient.post('/mollie/transaction/start', { token: token });
    }
    return module;
  })

  return client.Mollie.startTransaction()
 
}

export default startTransaction