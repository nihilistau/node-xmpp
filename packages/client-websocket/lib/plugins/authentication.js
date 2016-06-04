'use strict'

const debug = require('debug')('xmpp:client:authentication')

module.exports = function (client) {
  client.authenticators = []

  let features

  client.authenticate = function (creds, cb) {
    const auth = client.authenticators.find(auth => auth.match(features))
    // FIXME cb error?
    if (!auth) throw new Error('No authentication found')
    debug('using ', auth.name)

    auth.authenticate(client, creds, features, cb)
  }

  client.on('stream:features', function (element) {
    features = element
  })
}
