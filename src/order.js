const crypto = require('crypto')

class Order {
  constructor({ id, price, amount }) {
    this.id = id ?? Order.createId()
    this.price = price
    this.amount = amount
  }

  serialize() {
    return {
      id: this.id,
      price: this.price,
      amount: this.amount,
    }
  }

  static createId() {
    return crypto.randomUUID()
  }

  static deserialize(payload) {
    return new Order(payload)
  }
}

module.exports = {
  Order,
}
