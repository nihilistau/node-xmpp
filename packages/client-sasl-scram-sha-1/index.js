'use strict'

const mech = require('sasl-scram-sha-1')

module.exports = function (client) {
  client.SASL.use(mech)
}
