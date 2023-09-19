const { Order } = require('./order')

class OrderBook {
  constructor(rpcClient, rpcKey, subClient, pubsubKey) {
    this.rpcClient = rpcClient
    this.subClient = subClient
    this.rpcKey = rpcKey
    this.pubsubKey = pubsubKey
    this.orders = []
    this.timeout = 10000
  }

  init() {
    this.subClient.on('message', (message) => {
      this._handleSubMessage(message)
    })

    this.subClient.sub(this.pubsubKey, {
      timeout: this.timeout,
    })
  }

  _handleSubMessage(message) {
    const { command, payload } = JSON.parse(message)

    switch (command) {
      case 'addOrder':
        this._addOrder(Order.deserialize(payload))
        break
      case 'removeOrder':
        this._removeOrder(Order.deserialize(payload))
        break
      default:
        console.error(`unknown command: ${command}`)
        break
    }
  }

  _addOrder(order) {
    console.log(`OrderBook#_addOrder`, order)

    this.orders.push(order)
  }

  async addOrder(order) {
    const message = {
      command: 'addOrder',
      payload: order.serialize(),
    }

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
    console.log(`OrderBook#_removeOrder`, order)

    this.orders = this.orders.filter((existingOrder) => {
      return existingOrder.id !== order.id
    })
  }

  async removeOrder(order) {
    const message = {
      command: 'removeOrder',
      payload: order.serialize(),
    }

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
}

module.exports = {
  OrderBook,
}
