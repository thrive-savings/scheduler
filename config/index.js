let publicConf = {}
let secretConf = {}
if (process.env.NODE_ENV === 'production') {
  publicConf = require('./production/public')
  secretConf = require('./production/secret')
} else {
  publicConf = require('./development/public')
  secretConf = require('./development/secret')
}

module.exports = Object.assign({}, publicConf, secretConf)
