const net = require("net");

const isIp = require("is-ip");
const ping = require("ping").promise;

const { base64Encode } = require("./helper.js");

const chr = String.fromCharCode;

class LegacyRemote {
  constructor(config) {
    this.config = {
      appString: "iphone..iapp.samsung",
      tvAppString: "iphone.UN60D6000.iapp.samsung",
      port: 55000,
      timeout: 5000,
      showDisconnectedLog: false,
      host: {},
      ...config
    };

    this.config.host = {
      ip: "127.0.0.1",
      mac: "00:00:00:00",
      name: "NodeJS Samsung Remote",
      ...this.config.host
    };

    if (!this.config.ip) throw new Error("TV IP address is required");
    if (!isIp(this.config.ip)) throw new Error("IP address format is wrong");
    if (!isIp(this.config.host.ip)) throw new Error("Host IP format is incorrect");
  }

  tryConnect() {
    return new Promise((resolve, reject) => {
      const socket = net.connect(this.config.port, this.config.ip);
      socket.setTimeout(this.config.timeout);
      socket.on("connect", () => {
        socket.end();
        socket.destroy();
        resolve();
      });
      socket.on("error", reject);
      socket.on("timeout", reject);
    }).then(() => true).catch(() => false);
  }

  send(command) {
    return new Promise((resolve, reject) => {
      if (!command) reject(Error("Missing command"));

      const socket = net.connect(this.config.port, this.config.ip);

      socket.setTimeout(this.config.timeout);

      socket.on("connect", () => {
        socket.write(this._socketChunkOne());
        socket.write(this._socketChunkTwo(command));
        socket.end();
        socket.destroy();
        resolve();
      });

      if (this.config.showDisconnectedLog) {
        socket.on("close", () => {
          console.log(`Samsung Remote Client: disconnected from ${this.config.ip}:${this.config.port}`);
        });
      }

      socket.on("error", (error) => {
        let errorMsg;

        if (error.code === "EHOSTUNREACH" || error.code === "ECONNREFUSED") {
          errorMsg = "Samsung Remote Client: Device is off or unreachable";
        } else {
          errorMsg = `Samsung Remote Client: ${error.code}`;
        }

        reject(Error(errorMsg));
      });

      socket.on("timeout", () => reject(Error("Timeout")));
    })
  }

  isAlive() {
    return ping.probe(this.config.ip).then(() => true).catch(() => false);
  }

  _socketChunkOne() {
    const ipEncoded = base64Encode(this.config.host.ip);
    const macEncoded = base64Encode(this.config.host.mac);

    const message = chr(0x64)
      + chr(0x00)
      + chr(ipEncoded.length)
      + chr(0x00)
      + ipEncoded
      + chr(macEncoded.length)
      + chr(0x00)
      + macEncoded
      + chr(base64Encode(this.config.host.name).length)
      + chr(0x00)
      + base64Encode(this.config.host.name);

    return chr(0x00)
      + chr(this.config.appString.length)
      + chr(0x00)
      + this.config.appString
      + chr(message.length)
      + chr(0x00)
      + message;
  }

  _socketChunkTwo(command) {
    const message = chr(0x00)
      + chr(0x00)
      + chr(0x00)
      + chr(base64Encode(command).length)
      + chr(0x00)
      + base64Encode(command);

    return chr(0x00)
      + chr(this.config.tvAppString.length)
      + chr(0x00)
      + this.config.tvAppString
      + chr(message.length)
      + chr(0x00)
      + message;
  }
}

module.exports = LegacyRemote;