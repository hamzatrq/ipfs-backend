const http = require('http');
const {IPFS_PORT} = require('./constants.js');

const lsUrl = `http://127.0.0.1:${IPFS_PORT}/api/v0/pin/ls`;
const req = http.request(lsUrl, {
  method: 'POST',
}, res => {
  const bs = [];
  res.on('data', d => {
    bs.push(d);
  });
  res.on('end', () => {
    const b = Buffer.concat(bs);
    const s = b.toString('utf8');
    const j = JSON.parse(s);
    const hashes = Object.keys(j.Keys);
    for (const hash of hashes) {
      console.log(hash);
    }
  });
});
req.on('error', err => {
  throw err;
});
req.end();