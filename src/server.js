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

  setInterval(() => {
    // console.log('announce-orderbook')
    link.announce(rpcKey, rpcService.port, {})
    link.announce(pubsubKey, pubService.port, {})

    // console.log('announce-orderbook:pub')
    // pubService.pub(
    //   JSON.stringify({
    //     command: 'addOrder',
    //     payload: {
    //       test: '123',
    //     },
    //   }),
    // )
  }, 1000)

  rpcService.on('request', (rid, key, payload, handler) => {
    // console.log('request')
    // console.log('request:rid', rid)
    // console.log('request:key', key)
    // console.log('request:payload', payload)
    // console.log('request:handler', handler)

    // const response = {
    //   msg: 'world',
    //   payload,
    // }

    // console.log('request:rpc:replying')
    handler.reply(null, {})

    // console.log('request:pub:publishing')
    pubService.pub(JSON.stringify(payload))
  })
}

main().catch((error) => {
  console.error(error)
})
