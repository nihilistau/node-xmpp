'use strict'

const mech = require('sasl-anonymous')

module.exports = function (client) {
  client.SASL.use(mech)
}
