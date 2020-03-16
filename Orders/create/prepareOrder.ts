const config = require('config')
import crypto from "crypto";
import OrderLineTypes from "../../helpers/OrderLineTypes"
import ProductsMapping from "../../helpers/ProductsMapping"
import { Locale, PaymentMethod, OrderLineType } from '@mollie/api-client';

export default (order: any, params: any) => {

  let sectret_key = config.extensions.mollie.api_key
  let algorithm = config.extensions.mollie.algorithm

  const locale: string = params.locale
  const paymentMethod: string = params.method
  const order_metadata = {
    order_id: order.entity_id,
    increment_id: order.increment_id
  }  
  let cipher = crypto.createCipher(algorithm, sectret_key)
  let encryptedOrderDetails = cipher.update(Object.values(order_metadata).join('-'),'utf8','hex')
  encryptedOrderDetails += cipher.final('hex');

  const billingAddress = order.billing_address
  const shippingDetails = order.extension_attributes.shipping_assignments.find(shipping_assignment => { 
    return shipping_assignment
  });
  const shippingAddress = shippingDetails.shipping.address

  const orderLines = order.items.map(orderItem => ({
    type: OrderLineType[OrderLineTypes(orderItem[ProductsMapping.type])],
    sku: orderItem[ProductsMapping.sku],
    name: orderItem[ProductsMapping.name],
    quantity: orderItem[ProductsMapping.quantity],
    vatRate: orderItem[ProductsMapping.vatRate].toFixed(2),
    unitPrice: {
      currency: order.order_currency_code,
      value: orderItem[ProductsMapping.unitPrice].toFixed(2)
    },
    totalAmount: {
      currency: order.order_currency_code,
      value: orderItem[ProductsMapping.totalAmount].toFixed(2)
    },
    discountAmount: {
      currency: order.order_currency_code,
      value: orderItem[ProductsMapping.discountAmount].toFixed(2)
    },
    vatAmount: {
      currency: order.order_currency_code,
      value: orderItem[ProductsMapping.vatAmount].toFixed(2)
    }
  }))

  orderLines.push({ 
    type: OrderLineType.shipping_fee,
    name: 'Shipping costs',
    quantity: 1,
    vatRate: '0.00',
    unitPrice: {
      currency: order.order_currency_code,
      value: shippingDetails.shipping.total.shipping_incl_tax.toFixed(2)
    },
    totalAmount: {
      currency: order.order_currency_code,
      value: shippingDetails.shipping.total.shipping_incl_tax.toFixed(2)
    },
    discountAmount: {
      currency: order.order_currency_code,
      value: shippingDetails.shipping.total.shipping_discount_amount.toFixed(2)
    },
    vatAmount: {
      currency: order.order_currency_code,
      value: shippingDetails.shipping.total.shipping_tax_amount.toFixed(2)
    }
  })

  const createOrderParams = {
    amount: {
      value: order.base_grand_total.toFixed(2),
      currency: order.order_currency_code,
    },
    billingAddress: {
      organizationName: (billingAddress.hasOwnProperty('company')) ? billingAddress.company : '',
      streetAndNumber: billingAddress.street.join(' '),
      city: billingAddress.city,
      region: billingAddress.region,
      postalCode: billingAddress.postcode,
      country: billingAddress.country_id,
      givenName: billingAddress.firstname,
      familyName: billingAddress.lastname,
      email: billingAddress.email,
      phone: billingAddress.telephone
    },
    shippingAddress: {
      organizationName: (shippingAddress.hasOwnProperty('company')) ? shippingAddress.company : '',
      streetAndNumber: shippingAddress.street.join(' '),
      city: shippingAddress.city,
      region: shippingAddress.region,
      postalCode: shippingAddress.postcode,
      country: shippingAddress.country_id,
      givenName: shippingAddress.firstname,
      familyName: shippingAddress.lastname,
      email: shippingAddress.email,
    },
    metadata: order_metadata,
    locale: Locale[locale],
    orderNumber: order.increment_id,
    redirectUrl: config.extensions.mollie.redirect_url + encryptedOrderDetails,
    webhookUrl: config.extensions.mollie.webhook_url,
    method: PaymentMethod[paymentMethod],
    lines: orderLines
  }

  return createOrderParams

}