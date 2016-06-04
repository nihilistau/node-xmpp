'use strict'

const {EventEmitter} = require('events')
const {inherits, ltx, parse} = require('node-xmpp-core')
const WS = require('ws')
const debug = require('debug')('xmpp:client:websocket')

const NS_FRAMING = 'urn:ietf:params:xml:ns:xmpp-framing'
const NS_STREAM = 'http://etherx.jabber.org/streams'
// const NS_CLIENT = 'jabber:client'

/* References
 * WebSocket protocol https://tools.ietf.org/html/rfc6455
 * WebSocket Web API https://html.spec.whatwg.org/multipage/comms.html#network
 * XMPP over WebSocket https://tools.ietf.org/html/rfc7395
*/

function WebSocket () {
  EventEmitter.call(this)
}

inherits(WebSocket, EventEmitter)

WebSocket.prototype.connect = function (url, cb) {
  const sock = this.socket = new WS(url, ['xmpp'])
  // FIXME remove listeners when closed/errored
  sock.addEventListener('open', this._openListener.bind(this))
  sock.addEventListener('message', this._messageListener.bind(this))
  sock.addEventListener('close', this._closeListener.bind(this))
  sock.addEventListener('error', this._errorListener.bind(this))

  if (cb) {
    const onConnect = () => {
      cb()
      sock.removeListener('error', onError)
    }
    const onError = (err) => {
      cb(err)
      sock.removeListener('connect', onConnect)
    }
    this.once('connect', onConnect)
    this.once('error', onError)
  }
}

WebSocket.prototype.open = function (domain, cb) {
  // FIXME timeout
  this.once('element', el => {
    if (el.name !== 'open') return // FIXME error
    if (el.attrs.version !== '1.0') return // FIXME error
    if (el.attrs.xmlns !== NS_FRAMING) return // FIXME error
    if (el.attrs.from !== domain) return // FIXME error
    if (!el.attrs.id) return // FIXME error

    this.emit('open')

    // FIXME timeout
    this.once('element', el => {
      if (el.name !== 'stream:features') return // FIXME error
      if (el.attrs['xmlns:stream'] !== NS_STREAM) return // FIXME error
   // if (stanza.attrs.xmlns !== NS_CLIENT) FIXME what about this one?

      cb(null, el)
      this.emit('stream:features', el)
    })
  })
  this.send(ltx`
    <open version="1.0" xmlns="${NS_FRAMING}" to="${domain}"/>
  `)
}

WebSocket.prototype._openListener = function () {
  debug('opened')
  this.emit('connect')
}

WebSocket.prototype._messageListener = function ({data}) {
  debug('<-', data)
  // if (typeof data !== 'string') FIXME stream error

  const element = parse(data) // FIXME use StreamParser
  this.emit('element', element)
}

WebSocket.prototype._closeListener = function () {
  debug('closed')
  this.emit('close')
}

WebSocket.prototype._errorListener = function (error) {
  debug('errored')
  this.emit('error', error)
}

WebSocket.prototype.send = function (data) {
  // FIXME ltx or node-xmpp-stanza should trim
  data = data.root().toString().trim()
  debug('->', data)
  this.socket.send(data)
}

WebSocket.match = function (client) {
  return client.options.websocket.url
}

WebSocket.NS_FRAMING = NS_FRAMING

module.exports = WebSocket

// // EXAMPLE

// const foo = new WebSocket()

// // emitted for any error
// foo.once('error', (err) => {
//   console.log('errored', err)
// })

// /*
//  * connection events
//  */
// // emitted when connection is established
// foo.once('connect', function () {
//   // console.log('connected')
//   foo.open('localhost')
// })
// // emitted when connection is closed
// foo.once('close', () => {
//   console.log('closed')
// })

// /*
//  * stream events
//  */
// // emitted when stream features are received
// foo.once('stream:features', (element) => {
//   console.log('features', element.toString())
// })
// // emitted when stream is open
// foo.once('stream:open', () => {
//   console.log('stream open')
// })
// // emitted when stream is closed
// foo.once('stream:close', () => {
//   console.log('stream close')
// })

// /*
//  * xml events
//  */
// // emitted for any incoming stanza or nonza
// foo.on('element', () => {})
// // emitted for any incoming stanza (iq, message, presence)
// foo.on('stanza', () => {})
// // emitted for any incoming nonza
// foo.on('nonza', () => {})

// foo.connect('http://localhost:5280/xmpp-websocket')

// // In-Band Registration https://xmpp.org/extensions/xep-0077.html
// const register = require('./register')
// // usage
// foo.once('stream:features', (element) => {
//   console.log('features', element.toString())
//   register(foo, {username: 'foo', password: 'bar'}, function (stanza) {
//     console.log('\nlolilol', stanza.toString())
//   })
// })

