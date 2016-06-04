'use strict'

const {ltx} = require('node-xmpp-core')

/* References
 *  - In-Band Registration https://xmpp.org/extensions/xep-0077.html
 *  - prosody mod_register https://prosody.im/doc/modules/mod_register
 */
function register (client, fields, cb) {
  // const iq = ltx`<iq type='get' xmlns='${NS_CLIENT}' to='localhost' id='reg1'><query xmlns='jabber:iq:register'/></iq>`

  const iq = ltx`
    <iq type='set' xmlns='jabber:client' to='${client._domain}'>
      <query xmlns='jabber:iq:register'>
        <username>${fields.username}</username>
        <password>${fields.password}</password>
      </query>
    </iq>
  `

  console.log(iq)

  client.request(iq, function (stanza) {
    cb(stanza)
  })
}

register.supported = function (element) {
  if (element.is('stream:features')) {
    return !!element.getChild('register', 'http://jabber.org/features/iq-register')
  }

  const query = element.getChild('query', 'http://jabber.org/protocol/disco#info')
  return element.is('iq') && query && query.getChild('register', 'jabber:iq:register')
}

module.exports = register


// In-Band Registration https://xmpp.org/extensions/xep-0077.html
const register = require('./register')
// usage
foo.once('stream:features', (element) => {
  console.log('features', element.toString())
  register(foo, {username: 'foo', password: 'bar'}, function (stanza) {
    console.log('\nlolilol', stanza.toString())
  })
})

