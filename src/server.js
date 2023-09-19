const Link = require('grenache-nodejs-link')
const { PeerPub, PeerRPCServer } = require('grenache-nodejs-ws')

const getRandomPort = () => {
  return 1024 + Math.floor(Math.random() * 10000)
}

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

  const rpcServer = new PeerRPCServer(link, {
    timeout,
  })
  rpcServer.init()

  const rpcPort = getRandomPort()
  const rpcService = rpcServer.transport('server')
  rpcService.listen(rpcPort)
  console.log(`RPC server listening on port ${rpcPort}`)

  const pubServer = new PeerPub(link, {
    timeout,
  })
  pubServer.init()

  const pubPort = getRandomPort()
  const pubService = pubServer.transport('server')
  pubService.listen(pubPort)
  console.log(`PUB server listening on port ${pubPort}`)

  let orders = []

  const getMatchingOrders = (order) => {
    return orders.filter((existingOrder) => {
      return (
        existingOrder.id !== order.id &&
        existingOrder.amount * order.amount < 0 &&
        Math.abs(existingOrder.price - order.price) < Number.EPSILON
      )
    })
  }

  const addOrder = (order) => {
    const matchingOrders = getMatchingOrders(order)

    if (matchingOrders.length === 0) {
      orders.push(order)
      pubService.pub(
        JSON.stringify({
          command: 'addOrder',
          payload: order,
        }),
      )
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

    const fulfilledOrders = orders.filter((existingOrder) => {
      return existingOrder.amount === 0
    })
    fulfilledOrders.forEach((fulfilledOrder) => {
      pubService.pub(
        JSON.stringify({
          command: 'removeOrder',
          payload: fulfilledOrder,
        }),
      )
    })

    orders = orders.filter((existingOrder) => {
      return existingOrder.amount !== 0
    })

    if (order.amount !== 0) {
      orders.push(order)
      pubService.pub(
        JSON.stringify({
          command: 'addOrder',
          payload: order,
        }),
      )
    }
  }

  const removeOrder = (order) => {
    orders = orders.filter((existingOrder) => {
      return existingOrder.id !== order.id
    })

    pubService.pub(
      JSON.stringify({
        command: 'removeOrder',
        payload: order,
      }),
    )
  }

  rpcService.on('request', (rid, key, message, handler) => {
    const { command, payload } = message

    switch (command) {
      case 'addOrder':
        addOrder(payload)
        break
      case 'removeOrder':
        removeOrder(payload)
        break
      default:
        console.error(`unknown command: ${command}`)
        break
    }

    handler.reply(null, {})
  })

  setInterval(() => {
    link.announce(rpcKey, rpcService.port, {})
    link.announce(pubsubKey, pubService.port, {})
  }, 1000)
}

main().catch((error) => {
  console.error(error)
})
