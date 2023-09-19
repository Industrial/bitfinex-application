const { Order } = require('./order')

class ServerOrderBook {
  constructor(rpcService, rpcKey, pubService, pubsubKey) {
    console.log(`ServerOrderBook#constructor`)

    this.rpcService = rpcService
    this.rpcKey = rpcKey
    this.pubService = pubService
    this.pubsubKey = pubsubKey
    this.orders = []
    this.timeout = 10000
  }

  init() {
    console.log(`ServerOrderBook#init`)

    this.rpcService.on('request', (...args) => {
      this._handleRPCMessage(...args)
    })
  }

  _handleRPCMessage(rid, key, message, handler) {
    console.log(`ServerOrderBook#_handleRPCMessage`, rid, key, message)

    const { command, payload } = message

    switch (command) {
      case 'addOrder':
        this.addOrder(Order.deserialize(payload))
        break
      case 'removeOrder':
        this.removeOrder(Order.deserialize(payload))
        break
      default:
        console.error(`unknown command: ${command}`)
        break
    }

    handler.reply(null, {})
  }

  _addOrder(order) {
    console.log(`ServerOrderBook#_addOrder`, order)

    this.orders.push(order)
    this.pubService.pub(
      JSON.stringify({
        command: 'addOrder',
        payload: order.serialize(),
      }),
    )
  }

  _getMatchingOrders(order) {
    console.log(`ServerOrderBook#_getMatchingOrders`, order)

    return this.orders.filter((existingOrder) => {
      return (
        existingOrder.id !== order.id &&
        existingOrder.amount * order.amount < 0 &&
        Math.abs(existingOrder.price - order.price) < Number.EPSILON
      )
    })
  }

  async addOrder(order) {
    console.log(`ServerOrderBook#addOrder`, order)

    const matchingOrders = this._getMatchingOrders(order)

    if (matchingOrders.length === 0) {
      this._addOrder(order)
      return
    }

    for (const matchingOrder of matchingOrders) {
      if (Math.abs(matchingOrder.amount) >= Math.abs(order.amount)) {
        matchingOrder.amount += order.amount
        order.amount = 0
        break
      } else {
        order.amount += matchingOrder.amount
        matchingOrder.amount = 0
      }
    }

    const fulfilledOrders = this.orders.filter((existingOrder) => {
      return existingOrder.amount === 0
    })

    console.log(`ServerOrderBook#addOrder:fulfilledOrder`, fulfilledOrders)

    fulfilledOrders.forEach((fulfilledOrder) => {
      this._removeOrder(fulfilledOrder)
    })

    if (order.amount !== 0) {
      this._addOrder(order)
    }
  }

  _removeOrder(order) {
    console.log(`ServerOrderBook#_removeOrder`, order)

    this.orders = this.orders.filter((existingOrder) => {
      return existingOrder.id !== order.id
    })
    this.pubService.pub(
      JSON.stringify({
        command: 'removeOrder',
        payload: order.serialize(),
      }),
    )
  }

  async removeOrder(order) {
    console.log(`ServerOrderBook#removeOrder`, order)

    this._removeOrder(order)
  }
}

module.exports = {
  ServerOrderBook,
}
