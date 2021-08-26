const http = require('http');
const {IPFS_PORT} = require('./constants.js');

if (process.argv[2]) {
  const rmUrl = `http://127.0.0.1:${IPFS_PORT}/api/v0/pin/rm?arg=`;
  const req = http.request(rmUrl + process.argv[2], {
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
    }); */
  });
  req.on('error', err => {
    throw err;
  });
  req.end();
} else {
  console.warn('missing hash argument');
  process.exit(1);
}