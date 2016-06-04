'use strict'

const mech = require('sasl-plain')

module.exports = function (client) {
  client.SASL.use(mech)
}
