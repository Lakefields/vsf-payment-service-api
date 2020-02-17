import { apiStatus } from '../../../lib/util'
import { Router } from 'express'
import bodyParser from 'body-parser';
import request from 'request'
import rp from 'request-promise-native';
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

  api.get('/fetch-issuers', (req, res) => {
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

  api.post('/post-payment', (req, res) => {
    const params = req.body
    let sectret_key = config.extensions.mollie.secret
    let algorithm = 'aes-256-cbc'

    const order_metadata = {
      "order_id": params.order_id
    }    
    let cipher = crypto.createCipher(algorithm,sectret_key)
    let encryptedOrderDetails = cipher.update(Object.values(order_metadata).join('-'),'utf8','hex')
    encryptedOrderDetails += cipher.final('hex');    

    const client = Magento2Client(config.magento2.api);
    client.addMethods('order', function (restClient) {
      var module = {};
      module.getSingleOrder = function () {
        return restClient.get('/orders/' + params.order_id);
      }
      return module;
    })
    
    client.order.getSingleOrder().then((result) => {

      const amount = {
        currency: params.currency,
        value: result.grand_total.toFixed(2)
      }    
      const payment_params = {
        amount: amount,
        metadata: order_metadata,
        description: params.description,
        redirectUrl: params.redirectUrl + encryptedOrderDetails,
        webhookUrl: config.extensions.mollie.webhook_url,
        method: params.method
      }
      if (params.hasOwnProperty('issuer')) {
        payment_params.issuer = params.issuer
      }  
      rp.post(config.extensions.mollie.api_url + '/v2/payments',
      {
        auth: {
          bearer: config.extensions.mollie.api_key
        },
        body: payment_params,
        json: true
      })
      .then((pspResponse) => {
        let transactionParams = {
          "order": {
            "entity_id": pspResponse.metadata.order_id,
          },
          "mollie_transaction_id": pspResponse.id,
          "mollie_secret_hash": "payload.hash"
        }
        client.addMethods('vsfMollie', function (restClient) {
          var module = {};
          module.addMollieData = function () {
            return restClient.put('/gn/vsf/mollie/order', transactionParams);
          }
          return module;
        })
        client.vsfMollie.addMollieData().then((backendResponse) => {
          const result = {
            "order_id": backendResponse.order_id,
            "amount": Object.values(pspResponse.amount).reverse().join(' '),
            "payment_gateway_url": pspResponse._links.checkout.href
          }
          console.log(result)
          apiStatus(res, result, 200);
        }).catch(err => {
          apiStatus(res, err, 500);
        })

      }).catch(err => {
        console.log(err)
        apiStatus(res, err, 500);
      }) 
    }).catch(err => {
      console.log(err)
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

  api.post('/get-payment-status', (req, res) => {
    let token = req.body.token
    let sectret_key = config.extensions.mollie.secret
    let algorithm = 'aes-256-cbc'   

    try {
      let decipher = crypto.createDecipher(algorithm,sectret_key)
      let decrypted = decipher.update(token,'hex','utf8')
      decrypted += decipher.final('utf8');
      const order_id = decrypted;
  
      const client = Magento2Client(config.magento2.api);
      client.addMethods('order', function (restClient) {
        var module = {};
        module.getSingleOrder = function () {
          return restClient.get('/orders/' + order_id);
        }
        return module;
      })
      client.order.getSingleOrder().then((orderDetails) => {
        const transaction_id = orderDetails.extension_attributes.gn_vsf_mollie_order.mollie_transaction_id
        rp.get(
          config.extensions.mollie.api_url + '/v2/payments/' + transaction_id,
          {
            auth: {
              bearer: config.extensions.mollie.api_key
            },
            json: true
          }
        )
        .then((pspResponse) => {
          const result = {
            'payment': {
              'status': pspResponse.status
            },
            'order': {
              'increment_id': orderDetails.increment_id,
              'customer_email': orderDetails.customer_email
            }
          }
          apiStatus(res, result, 200);
        }).catch(err => {
          console.log(err)
          apiStatus(res, err, 500);
        })
      }).catch(err => {
        console.log(err)
        apiStatus(res, err, 500);
      })
    } catch (err) {
      console.log("Decryption error: ", err.message)
      apiStatus(res, err.message, 500)
    }
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

  return api
}
