'use strict'

const mech = require('alt-sasl-digest-md5')

module.exports = function (client) {
  client.SASL.use(mech)
}
