const crypto = require('crypto')

class Order {
  static createId() {
    return crypto.randomUUID()
  }

  constructor(price, amount) {
    this.id = Order.createId()
    this.price = price
    this.amount = amount
  }
}

class OrderBook {
  constructor(rpcClient) {
    this.rpcClient = rpcClient
    this.orders = {}
  }

  async addOrder(order) {
    this.orders[order.id] = order

    const message = {
      command: 'addOrder',
      payload: {
        id: order.id,
        price: order.price,
        amount: order.amount,
      },
    }

    const response = await new Promise((resolve, reject) => {
      this.rpcClient.request('orderbook', message, { timeout: 10000 }, (error, data) => {
        if (error) {
          reject(error)
          return
        }

        resolve(data)
      })
    })

    console.log('response', response)

    return response
  }

  async removeOrder(order) {
    delete this.orders[order.id]
  }
}

module.exports = {
  Order,
  OrderBook,
}
