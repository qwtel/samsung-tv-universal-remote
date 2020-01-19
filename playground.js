const getUniversalRemote = require('./index.js')

getUniversalRemote({ ip: '192.168.1.12' }).then(x => console.log(x))