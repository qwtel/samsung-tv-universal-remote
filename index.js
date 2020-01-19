const LegacyRemote = require('./legacy-remote.js');
const TizenRemote = require('./tizen-remote.js');

async function getUniversalRemote(config) {
  for (const Remote of [TizenRemote, LegacyRemote]) {
    const remote = new Remote(config);
    if (await remote.tryConnect()) return remote;
  }
  throw Error('No matching remote found')
}

module.exports = getUniversalRemote;