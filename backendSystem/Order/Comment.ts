const config = require('config')
import OrderCommentData from "../helpers/OrderCommentData"

const orderComment = async (comment_data) => {

  const Magento2Client = require('magento2-rest-client').Magento2Client
  const client = Magento2Client(config.magento2.api);
  client.addMethods('orderComment', function (restClient) {
  let module: any = {};
  module.postOrderComment = function () {
    return restClient.post('/orders/' + comment_data.order_id + '/comments', OrderCommentData(comment_data));
  }
  return module;
  })
  return client.orderComment.postOrderComment()
 
}

export default orderComment