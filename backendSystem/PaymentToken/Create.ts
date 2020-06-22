const config = require('config')

const createPaymentToken = async (cart_id) => {

  const Magento2Client = require('magento2-rest-client').Magento2Client
  const client = Magento2Client(config.magento2.api);
  client.addMethods('paymentToken', function (restClient) {
    let module: any = {};
    module.createToken = function () {
      return restClient.get('/guest-carts/' + cart_id + '/mollie/payment-token');
    }
    return module;
  })

  return client.paymentToken.createToken()
 
}

export default createPaymentToken
