const Link = require('grenache-nodejs-link')
const { Order, OrderBook } = require('./order-book')
const { PeerSub, PeerRPCClient } = require('grenache-nodejs-ws')

const timeout = 1000

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

  console.log('subscribing to orderbook_update')
  subClient.sub('orderbook_pub', {
    timeout,
  })

  subClient.on('connected', () => {
    console.log('sub:connected')
  })

  subClient.on('disconnected', () => {
    console.log('sub:disconnected')
  })

  subClient.on('message', (...args) => {
    console.log('sub:message', ...args)
  })

  // const requestStream = rpcClient.stream('orderbook', {})
  // console.log('requestStream', requestStream)

  // rpcClient.request(
  //   'orderbook',
  //   {
  //     msg: 'hello',
  //     grape: process.env.GRAPE_NODE,
  //   },
  //   { timeout: 10000 },
  //   (err, data) => {
  //     if (err) {
  //       console.error(err)
  //       process.exit(-1)
  //     }
  //     console.log(data)
  //   },
  // )

  // const orderBook = new OrderBook(peer)

  // const price = Math.random()
  // const amount = Math.random() * 10000
  // const order = new Order(price, amount)

  // await orderBook.addOrder(order)
}

main().catch((error) => {
  console.error(error)
})
