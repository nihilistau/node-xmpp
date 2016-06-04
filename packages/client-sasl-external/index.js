'use strict'

const mech = require('sasl-external')

module.exports = function (client) {
  client.SASL.use(mech)
}
