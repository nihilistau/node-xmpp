'use strict'

const {EventEmitter} = require('events')
const {inherits} = require('node-xmpp-core')
const debug = require('debug')('xmpp:client')

function Client (options = {}) {
  EventEmitter.call(this)

  this.transports = []
  this.transport = null
  this.options = options
  this.iqHandlers = Object.create(null)
  this.hooks = new Map()
}

Client.prototype.connect = function (cb) {
  let options
  const Transport = this.transports.find(Transport => {
    return options = Transport.match(this) // eslint-disable-line no-return-assign
  })

  // FIXME callback?
  if (!Transport) throw new Error('No transport found')

  debug('using', Transport.name, 'transport with', options)

  const transport = this.transport = new Transport()
  ;['stream:features', 'element', 'close', 'error'].forEach((e) => {
    transport.on(e, (...args) => this.emit(e, ...args))
  })

  // FIXME merge connect and open?
  // remove stream features event from transport?
  transport.connect(options, (err) => {
    if (err) return cb(err)
    transport.open(this.options.domain, (err, el) => {
      if (err) return cb(err)
      // console.log(el.toString())

      // emit('authenticate')
    })
  })
}

// merge with send? add timeout? FIXME
Client.prototype.request = function (stanza, cb) {
  stanza = stanza.root()
  const id = stanza.attrs.id || (stanza.attrs.id = Math.random().toString())
  this.iqHandlers[id] = cb
  this.send(stanza)
}

Client.prototype._onelement = function (element) {
  debug('<-', element.toString())
  this.emit('element', element)

  ;['iq', 'message', 'presence'].some(
    n => n === element.name
  )
    ? this.emit('stanza', element)
    : this.emit('nonza', element)

  if (element.is('iq') && element.attrs.type !== 'set') {
    const handler = this.iqHandlers[element.attrs.id]
    if (handler) handler(element)
  }

  for (const match of this.hooks) {
    if (match(element)) {
      this.hooks.get(match)(element)
    }
  }
}

Client.prototype.send = function (stanza) {
  stanza = stanza.root()

  // FIXME
  if (!stanza.attrs.to) stanza.attrs.to = this.options.domain

  if (debug.enabled) {
    debug('->', stanza.toString())
  }

  this.transport.send(stanza)
}

Client.prototype.use = function (plugin) {
  plugin(this)
}

inherits(Client, EventEmitter)

const WebSocket = require('./WebSocket')

const foo = new Client({
  domain: 'localhost',
  websocket: {
    url: 'http://localhost:5280/xmpp-websocket'
  },
  sasl: ['plain']
})

foo.transports.push(WebSocket)

// emitted for any error
foo.once('error', (err) => {
  console.log('errored', err)
})

/*
 * connection events
 */
// emitted when connection is established
foo.once('connect', function () {
  // console.log('connected')
  foo.open('localhost')
})
// emitted when connection is closed
foo.once('close', () => {
  console.log('closed')
})

/*
 * stream events
 */
// emitted when stream features are received
foo.once('stream:features', (element) => {
  console.log('features')
  // console.log('features', element.toString())
})
// emitted when stream is open
foo.once('stream:open', () => {
  console.log('stream open')
})
// emitted when stream is closed
foo.once('stream:close', () => {
  console.log('stream close')
})

/*
 * xml events
 */
// emitted for any incoming stanza or nonza
foo.on('element', () => {})
// emitted for any incoming stanza (iq, message, presence)
foo.on('stanza', () => {})
// emitted for any incoming nonza
foo.on('nonza', () => {})

foo.connect()

foo.use(require('./plugins/authentication'))
foo.use(require('./plugins/SASL'))
foo.use(require('./plugins/SASL-scram-sha-1'))
// foo.use(require('./plugins/SASL-plain'))

foo.on('stream:features', function () {
  foo.authenticate({'username': 'sonny', 'password': 'foobar'}, function () {})
})

// const server = foo.options.domain

// foo.on('authenticate', (cb) => {
//   cb(null, {
//     username: 'sonny',
//     password: 'sdfg4445',
//     server: server,
//     host: server,
//     realm: server,
//     serviceType: 'xmpp',
//     serviceName: server
//   })
// })
