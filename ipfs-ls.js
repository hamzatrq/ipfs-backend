const http = require('http');
const {IPFS_PORT} = require('./constants.js');

// const rmUrl = `http://127.0.0.1:${IPFS_PORT}/api/v0/pin/rm?arg=`;
const lsUrl = `http://127.0.0.1:${IPFS_PORT}/api/v0/pin/ls`;
// const gcUrl = `http://127.0.0.1:${IPFS_PORT}/api/v0/pin/ls`;
const req = http.get(lsUrl, res => {
  const bs = [];
  res.on('data', d => {
    bs.push(d);
  });
  res.on('end', () => {
    const b = Buffer.concat(bs);
    const s = b.toString('utf8');
    const j = JSON.parse(s);
    console.log('got j', j);
  });
});
req.on('error', err => {
  throw err;
});
req.end();