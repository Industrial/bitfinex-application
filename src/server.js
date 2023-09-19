const Link = require('grenache-nodejs-link')
const { PeerPub, PeerRPCServer } = require('grenache-nodejs-ws')
const { ServerOrderBook } = require('./server-order-book')

const getRandomPort = () => {
  return 1024 + Math.floor(Math.random() * 10000)
}

const timeout = 10000
const rpcKey = 'orderbook_rpc'
const pubsubKey = 'orderbook_pubsub'

const main = async () => {
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

  const serverOrderBook = new ServerOrderBook(rpcService, rpcKey, pubService, pubsubKey)
  serverOrderBook.init()

  // TODO: Maybe put this in the ServerOrderBook implementation
  setInterval(() => {
    link.announce(rpcKey, rpcService.port, {})
    link.announce(pubsubKey, pubService.port, {})
  }, 1000)
}

main().catch((error) => {
  console.error(error)
})
