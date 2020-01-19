const WebSocket = require('ws');
const isIp = require("is-ip");
const ping = require("ping").promise;

const { base64Encode, ParamsURL } = require('./helper.js');

class TizenRemote {
  constructor (config) {
    this.config = {
      ...config,
      name: config.name || 'SamsungTvRemote',
      mac: config.mac || '00:00:00:00',
      port: config.port || 8001,
      timeout: config.timeout || 5000,
    };

    if (!this.config.ip) throw new Error("TV IP address is required");
    if (!isIp(this.config.ip)) throw new Error("IP address format is wrong");

    this.url = new ParamsURL(`http://${this.config.ip}:${this.config.port}/api/v2/channels/samsung.remote.control`, {
      name: base64Encode(this.config.name),
    });
  }

  tryConnect() {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.url, {
        handshakeTimeout: this.config.timeout,
      });
      ws.on('error', reject);
      ws.on('message', resolve);
    }).then(() => true).catch(() => false);
  }

  send(command) {
    return new Promise((resolve, reject) => {
      if (!command) reject(Error("Missing command"));

      const ws = new WebSocket(this.url, {
        handshakeTimeout: this.config.timeout,
      });
      ws.on('error', reject);
      ws.on('message', (data) => {
        const { event } = JSON.parse(data);
        if (event === 'ms.channel.connect') {
          ws.send(JSON.stringify({
            method: 'ms.remote.control',
            params: {
              Cmd: 'Click',
              DataOfCmd: command,
              Option: 'false',
              TypeOfRemote: 'SendRemoteKey'
            }
          }));
          setTimeout(() => ws.close(), 1000);
        }
      });

      // FIXME: Ideally we would like to have some kind of confirmation before we resolve the promise,
      // but I don't have access to a Tizen Samsung TV so I can only implement the code from `samsung-tv-remote`
      resolve();
    });
  }

  isAlive() {
    return ping.probe(this.config.ip).then(response => !!response).catch(() => false);
  }
}

module.exports = TizenRemote;