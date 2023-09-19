const Link = require('grenache-nodejs-link')
const { Order, OrderBook } = require('./order-book')
const { PeerSub, PeerRPCClient } = require('grenache-nodejs-ws')

const timeout = 10000
const rpcKey = 'orderbook_rpc'
const pubsubKey = 'orderbook_pubsub'

const main = async () => {
  console.log('main')

  const link = new Link({
    grape: process.env.GRAPE_NODE,
  })
  link.start()
  console.log('link', link.conf.grape)

  const rpcClient = new PeerRPCClient(link, {})
  rpcClient.init()

  const subClient = new PeerSub(link, {})
  subClient.init()

  const orderBook = new OrderBook(rpcClient, rpcKey, subClient, pubsubKey)
  orderBook.init()

  setInterval(async () => {
    const price = Math.random().toFixed(1)
    const amount = (Math.random() - 0.5) * 10000
    const order = new Order({ price, amount })
    await orderBook.addOrder(order)
  }, 1000)
}

main().catch((error) => {
  console.error(error)
})
