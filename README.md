# Vue Storefront API extension for Payment Service module
Vue Storefront API extension to communicate with the Mollie Payments API and Magento 2.

# Purpose
The backend layer for the Vue Storefront Payment Service module. This Vue Storefront API extension takes care of the communication with the Mollie Payments API and Magento 2.

# Installation Guide
Follow these steps to install this API extenstion to the Vue Storefront API. 

**Requirements for Vue Storefront API**

Clone this git repository from within your vue-storefront-api root folder

```shell
git clone git@github.com:Lakefields/vsf-payment-ervices-api.git src/api/extensions/vsf-payment-service-api
```

**Run yarn to install dependencies**

# Register the Vue Storefront API extension
Add the API extension to the registered extensions to `local/config.json`

```
...
"registeredExtensions": [
  ...,
  "vsf-payment-service-api"
]
```

1. Add the config properties to `local/config.json`

```
...
"extensions": {
  ...
  "mollie": {
    "api_key": "YOUR_MOLLIE_API_KEY",
    "api_url": "https://api.mollie.com",
    "secret": "__SECRET_CHANGE_ME__",
    "webhook_url": "http://localhost:8080/api/ext/vsf-payment-service-api/webhook"
  }   
}

```

**NB:** for testing purposes use a reachable url. Mollie tries to connect to the webhook url before posting the payment. If you don't add a reachable url the payment is not created.

**Make sure you add the correct config settings for your project.** Make sure to generate a proper secret value.

# Support
This extension is built to support the Payment Service for Vue Storefront module.
Use at your own responsibility in your project. This extension is tested on Vue Storefront API 1.11.0.
If you need any assistance or want to do feature requests you can turn to these channels:

**NB**: Any feedback is more than welcome and we would really like it if you could post in the following places:

* Create issue in this Github repository
* Add comment on the Vue Storefront Forum - Mollie Payments API payment integration Module thread: 
* Join the [Vue Storefront Slack community](https://vuestorefront.slack.com) via [invitation link](https://join.slack.com/t/vuestorefront/shared_invite/enQtOTUwNjQyNjY5MDI0LWFmYzE4NTYxNDBhZDRlMjM5MDUzY2RiMjU0YTRjYWQ3YzdkY2YzZjZhZDZmMDUwMWQyOWRmZjQ3NDgwZGQ3NTk)

# License
This extension is completely free and released under the MIT License.