import { apiStatus } from '../../../lib/util'
import { Router } from 'express'
import bodyParser from 'body-parser';
import request from 'request'
import { sha3_224 } from 'js-sha3'
import crypto from "crypto";
const Magento2Client = require('magento2-rest-client').Magento2Client

module.exports = ({ config, db }) => {
  let api = Router()

  api.get('/payment-methods', (req, res) => {
    console.log('request =' + JSON.stringify(req.body))

    request.get(
      config.extensions.mollie.api_url + '/v2/methods',
      {
        auth: {
          bearer: config.extensions.mollie.api_key
        }
      },
      function(err, response) {
        if (err) {
          console.error(err)
          return res.sendStatus(500)
        }
        res.json(JSON.parse(response.body))
      }
    )
  })

  api.get('/ideal-issuers', (req, res) => {
    console.log('request =' + JSON.stringify(req.body))

    request.get(
      config.extensions.mollie.api_url + '/v2/methods/ideal?include=issuers',
      {
        auth: {
          bearer: config.extensions.mollie.api_key
        }
      },
      function(err, response) {
        if (err) {
          console.error(err)
          return res.sendStatus(500)
        }
        res.json(JSON.parse(response.body))
      }
    )
  })

  api.post('/order-details', (req, res) => {
    console.log("req-body: ", req.body)
    const client = Magento2Client(config.magento2.api);
    client.addMethods('order', function (restClient) {
    var module = {};
    module.getSingleOrder = function () {
      return restClient.get('/orders/' + req.body.order_id);
    }
    return module;
    })
    client.order.getSingleOrder().then((result) => {
      const response = {
        increment_id: result.increment_id,
        hash: sha3_224(config.extensions.mollie.secret + result.entity_id + result.grand_total.toFixed(2))
      }
      if(req.body.hasOwnProperty('validatePayment') && req.body.validatePayment) {
        console.log("gn_vsf_mollie_order: ", result.extension_attributes.gn_vsf_mollie_order)
        response.transaction_id = result.extension_attributes.gn_vsf_mollie_order.mollie_transaction_id;
        response.customer_email = result.customer_email;
      }
      console.log("getSingleOrder resonse: ", response)
      apiStatus(res, response, 200); // just dump it to the browser, result = JSON object
    }).catch(err => {
      console.log(err)
      apiStatus(res, err, 500);
    })
  })

  api.post('/validate-hash', (req, res) => {
    let hash = req.body.hash
    const sectret_key = config.extensions.mollie.secret
    let regen_hash = sha3_224(sectret_key + req.body.order_id + req.body.cart_total)
    
    if (regen_hash !== hash) {
      console.error('Cart total hash does not match order total hash')
      apiStatus(res, 'Hash invalid', 500);
    } else {
      console.log('Hash validated: ', hash, regen_hash)
      apiStatus(res, 'Hash validated', 200);  
    }
  })

  api.post('/post-payment', (req, res) => {
    const params = req.body
    let sectret_key = config.extensions.mollie.secret
    let algorithm = 'aes-256-cbc'
    const regen_hash = sha3_224(sectret_key + params.order_id + params.amount.value)
    const hash = params.hash
  
    if(regen_hash !== hash) {
      apiStatus(res, 'Hashes do not match', 500);
      return
    }
    const order_metadata = {
      "order_id": params.order_id,
      "hash": params.hash
    }

    console.log("Post Payment Params: ", params)
    console.log("orderdetailsstring ", Object.values(order_metadata).join('-'))

    let cipher = crypto.createCipher(algorithm,sectret_key)
    let encryptedOrderDetails = cipher.update(Object.values(order_metadata).join('-'),'utf8','hex')
    encryptedOrderDetails += cipher.final('hex');
    
    const payment_params = {
      amount: params.amount,
      metadata: order_metadata,
      description: params.description,
      redirectUrl: params.redirectUrl + encryptedOrderDetails,
      webhookUrl: config.extensions.mollie.webhook_url,
      method: params.method
    }
    if (params.hasOwnProperty('issuer')) {
      payment_params.issuer = params.issuer
    }
    console.log("Mollie params: ", payment_params)

    request.post(
      config.extensions.mollie.api_url + '/v2/payments',
      {
        auth: {
          bearer: config.extensions.mollie.api_key
        },
        body: payment_params,
        json: true
      },
      function(err, response) {
        if (err) {
          apiStatus(res, err, 500);
        } else {
          apiStatus(res, response.body, 200);          
        }
      }
    )
  })

  api.post('/set-mollie-transaction-data', (req, res) => {
    const client = Magento2Client(config.magento2.api);
    client.addMethods('vsfMollie', function (restClient) {
    var module = {};
    module.addMollieData = function () {
      return restClient.put('/gn/vsf/mollie/order', req.body);
    }
    return module;
    })
    client.vsfMollie.addMollieData().then((result) => {
      apiStatus(res, result, 200); // just dump it to the browser, result = JSON object
    }).catch(err => {
      apiStatus(res, err, 500);
    })
  })    

  api.post('/order-comments', (req, res) => {
    const client = Magento2Client(config.magento2.api);
    client.addMethods('orderComment', function (restClient) {
    var module = {};
    module.postOrderComment = function () {
      return restClient.post('/orders/' + req.body.order_id + '/comments', req.body.order_comment);
    }
    return module;
    })
    client.orderComment.postOrderComment().then((result) => {
      apiStatus(res, result, 200); // just dump it to the browser, result = JSON object
    }).catch(err => {
      apiStatus(res, err, 500);
    })
  })

  api.post('/decrypt-token', (req, res) => {
    let token = req.body.token
    let sectret_key = config.extensions.mollie.secret
    let algorithm = 'aes-256-cbc'   

    try {
      let decipher = crypto.createDecipher(algorithm,sectret_key)
      let decrypted = decipher.update(token,'hex','utf8')
      decrypted += decipher.final('utf8');
      let decryptedOrderDetails = decrypted.split("-");
  
      let OrderDetails = {
        order_id: parseInt(decryptedOrderDetails[0]),
        hash: decryptedOrderDetails[1]
      }
      if(Object.entries(OrderDetails).length === 0) {
        throw new Error('Order details not complete')
      }
      console.log("Decrypted order Details: ", OrderDetails)
      apiStatus(res, OrderDetails, 200)
    } catch (err) {
      console.log("Decryption error: ", err.message)
      apiStatus(res, err.message, 500)
    }
  })

  api.post('/get-payment', (req, res) => {
    console.log("Get-payment: ", req.body)
    request.get(
      config.extensions.mollie.api_url + '/v2/payments/' + req.body.id,
      {
        auth: {
          bearer: config.extensions.mollie.api_key
        },
        json: true
      },
      function(err, response) {
        // console.log(response)
        if (err) {
          // console.error(err)
          return res.sendStatus(500)
        }
        apiStatus(res, response.body, 200);
        
      }
    )
  })

  api.use(bodyParser.urlencoded({
    extended: true
  }));
  api.post('/webhook', (req, res) => {
    console.log("from webhook: ", req.body)
    if(req.body.id) {
      console.log(req.body.id)

      request.get(
        config.extensions.mollie.api_url + '/v2/payments/' + req.body.id,
        {
          auth: {
            bearer: config.extensions.mollie.api_key
          },
          json: true
        },
        function(err, response) {
          let status = response.body.status
           console.log("from webhook: ", response.body.metadata.order_id)

          if (status == 404) {
            console.error(response.body.detail)
            return res.sendStatus(500)
          }
          if (status == 'paid') {

            const client = Magento2Client(config.magento2.api);
            client.addMethods('invoice', function(restClient) {
              var module = {};

              module.create = function() {
                return restClient.post('/order/'+ response.body.metadata.order_id + '/invoice', {
                  "capture": false,
                  "notify": true
                });
              };
              return module;
            });
            client.invoice
              .create()
              .then(result => {
                console.log(result)
                res.sendStatus(200)
              })
              .catch(err => {
                console.log(err)
                res.sendStatus(500)
              });
          }

          if (status == 'canceled' || status == 'failed' || status == 'expired') {
            const client = Magento2Client(config.magento2.api);
            client.addMethods('order', function(restClient) {
              var module = {};

              module.cancel = function() {
                return restClient.post('/orders/'+ response.body.metadata.order_id + '/cancel');
              };
              return module;
            });
            client.order
              .cancel()
              .then(result => {
                console.log(result)
                res.sendStatus(200)
              })
              .catch(err => {
                console.log(err)
                res.sendStatus(500)
              });
          }

          apiStatus(res, 200);
          
        }
      )
    } else {
      console.log('No ID posted in webhook call')
      res.sendStatus(500)
    }
  })

  api.get('/redis-order/:order_id', (req, res) => {
    const Redis = require('redis');
    console.log("orderid", req.params.order_id)
    let redisClient = Redis.createClient(config.redis); // redis client
    redisClient.on('error', function(err) {
      // workaround for https://github.com/NodeRedis/node_redis/issues/713
      redisClient = Redis.createClient(config.redis); // redis client
    });

    redisClient.get('order$$id$$' + req.params.order_id, function(
      err,
      reply,
    ) {
      // console.log(reply)
      const orderMetaData = JSON.parse(reply);
      if (orderMetaData) {
        orderMetaData.order = null; // for security reasons we're just clearing out the real order data as it's set by `order_2_magento2.js`
      }
      apiStatus(res, err ? err : orderMetaData, err ? 500 : 200);
    });
  })

  return api
}
