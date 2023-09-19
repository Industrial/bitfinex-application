const crypto = require('crypto')

class Order {
  constructor({ id, price, amount }) {
    // console.log(`Order#constructor`)

    this.id = id ?? Order.createId()
    this.price = price
    this.amount = amount
  }

  serialize() {
    // console.log(`Order#serialize`)

    return {
      id: this.id,
      price: this.price,
      amount: this.amount,
    }
  }

  static createId() {
    // console.log(`Order.createId`)

    return crypto.randomUUID()
  }

  static deserialize(payload) {
    // console.log(`Order.deserialize`)

    return new Order(payload)
  }
}

class OrderBook {
  constructor(rpcClient, rpcKey, subClient, pubsubKey) {
    // console.log(`OrderBook#constructor`)

    this.rpcClient = rpcClient
    this.subClient = subClient
    this.rpcKey = rpcKey
    this.pubsubKey = pubsubKey
    this.orders = {}
    this.timeout = 10000
  }

  init() {
    // console.log(`Orderbook#init`)

    this.subClient.on('message', (message) => {
      this._handleSubMessage(message)
    })

    this.subClient.sub(this.pubsubKey, {
      timeout: this.timeout,
    })
  }

  _handleSubMessage(message) {
    // console.log(`Orderbook#_handleSubMessage`, message)

    const { command, payload } = JSON.parse(message)

    switch (command) {
      case 'addOrder':
        this._addOrder(Order.deserialize(payload))
        break
      default:
        console.error(`unknown command: ${command}`)
        break
    }
  }

  _addOrder(order) {
    console.log(`Orderbook#_addOrder`, order)

    this.orders[order.id] = order
  }

  async addOrder(order) {
    // console.log(`Orderbook#addOrder`, order)

    this._addOrder(order)

    const message = {
      command: 'addOrder',
      payload: order.serialize(),
    }

    // console.log(`Orderbook#addOrder:message`, message)

    await new Promise((resolve, reject) => {
      this.rpcClient.request(this.rpcKey, message, { timeout: this.timeout }, (error, data) => {
        if (error) {
          reject(error)
          return
        }
        resolve(data)
      })
    })
  }

  _removeOrder(order) {
    console.log(`Orderbook#_removeOrder`, order)

    delete this.orders[order.id]
  }

  async removeOrder(order) {
    // console.log(`Orderbook#removeOrder`, order)

    this._removeOrder(order)
  }
}

module.exports = {
  Order,
  OrderBook,
}
