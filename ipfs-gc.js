const http = require('http');
const {IPFS_PORT} = require('./constants.js');

const gcUrl = `http://127.0.0.1:${IPFS_PORT}/api/v0/repo/gc`;
const req = http.request(gcUrl, {
  method: 'POST',
}, res => {
  res.pipe(process.stdout);
  /* const bs = [];
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
  }); */
});
req.on('error', err => {
  throw err;
});
req.end();