'use strict'

const mech = require('sasl-x-facebook-platform')

module.exports = function (client) {
  client.SASL.use(mech)
}
