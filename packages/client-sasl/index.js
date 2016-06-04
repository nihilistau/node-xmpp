'use strict'

const {ltx} = require('node-xmpp-core')
const debug = require('debug')('xmpp:client:sasl')
const SASLFactory = require('saslmechanisms')
const assign = require('lodash.assign')
const {encode} = require('../b64')

const NS_SASL = 'urn:ietf:params:xml:ns:xmpp-sasl'
// const SASL_MECHS = {
  // external: require('sasl-external'),
  // 'scram-sha-1': require('sasl-scram-sha-1'),
  // 'digest-md5': require('alt-sasl-digest-md5'),
  // 'x-oauth2': require('sasl-x-oauth2'),
  // anonymous: require('sasl-anonymous')
// }



function getBestMechanism (SASL, mechs, features) {
  // FIXME preference order ?
  // var SASL = new SASLFactory()
  // mechs.forEach((mech) => {
  //   if (typeof mech === 'string') {
  //     const existingMech = SASL_MECHS[mech.toLowerCase()]
  //     if (existingMech) {
  //       SASL.use(existingMech)
  //     }
  //   } else {
  //     SASL.use(mech)
  //   }
  // })

  const mechanisms = features.getChild('mechanisms', NS_SASL).children.map(el => el.text())
  return SASL.create(mechanisms)
}

function authenticate (client, creds, features, cb) {
  const mech = getBestMechanism(client.SASL, client.options.sasl, features)
  if (!mech) {
    debug('no compatible mechanism')
    return
  }

  const {domain} = client.options

  creds = assign({
    username: null,
    password: null,
    server: domain,
    host: domain,
    realm: domain,
    serviceType: 'xmpp',
    serviceName: domain
  }, creds)

  if (debug.enabled) {
    const {password} = creds
    creds.password = '******'
    debug('using credentials', creds)
    creds.password = password
  }

  if (mech.clientFirst) {
    // replace with auth plugin
    // client.emit('authenticate', (err, creds) => {
      // if (err) {
        // client.send(ltx`<abort xmlns='${NS_SASL}'/>`)
        // return
      // }

      client.send(ltx`
        <auth xmlns='${NS_SASL}' mechanism='PLAIN'>${encode(mech.response(creds))}</auth>
      `)
    // })
  }

  const handler = (element) => {
    if (element.xmlns !== NS_SASL) return

    if (element.name === 'failure') {

      client.removeListener('stanza', handler)
    } else if (element.name === 'success') {

      client.removeListener('stanza', handler)
    }

    if (element.name === 'challenge') {
      client.removeListener('stanza', handler)
    }
  }

  client.on('nonza', handler)
}

function match (features) {
  return !!features.getChild('mechanisms', NS_SASL)
}

const authenticator = {authenticate, match, name: 'SASL'}

module.exports = function (client) {
  client.SASL = new SASLFactory()
  client.authenticators.push(authenticator)
}

