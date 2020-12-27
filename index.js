const path = require('path');
const stream = require('stream');
const fs = require('fs');
const url = require('url');
const querystring = require('querystring');
const http = require('http');
const https = require('https');
const dns = require('dns');
const crypto = require('crypto');
const zlib = require('zlib');
const os = require('os');
const child_process = require('child_process');
const mkdirp = require('mkdirp');
const FormData = require('form-data');
// const express = require('express');
const httpProxy = require('http-proxy');
const ws = require('ws');
const LRU = require('lru');
const request = require('request');
const mime = require('mime');
const AWS = require('aws-sdk');
const Stripe = require('stripe');
// const puppeteer = require('puppeteer');
const namegen = require('./namegen.js');
const Base64Encoder = require('./encoder.js').Encoder;
// const {JSONServer, CustomEvent} = require('./dist/sync-server.js');
const fetch = require('node-fetch');
const {SHA3} = require('sha3');
const {default: formurlencoded} = require('form-urlencoded');
// const Web3 = require('web3');
// const bip39 = require('bip39');
// const {hdkey} = require('ethereumjs-wallet');
// const blockchain = require('./blockchain.js');
const {getExt, makePromise} = require('./utils.js');
// const browserManager = require('./browser-manager.js');

// const api = require('./api.js');
// const { _handleStorageRequest } = require('./routes/storage.js');
// const { _handleAccountsRequest } = require('./routes/accounts.js');
// const { _handlePreviewRequest } = require('./routes/preview.js')
// const { worldManager, _handleWorldsRequest, _startWorldsRoute } = require('./routes/worlds.js');
// const { _handleSignRequest } = require('./routes/sign.js');
// const { _handleAnalyticsRequest } = require('./routes/analytics.js');

const CERT = fs.readFileSync('./certs/fullchain.pem');
const PRIVKEY = fs.readFileSync('./certs/privkey.pem');

const PORT = parseInt(process.env.PORT, 10) || 80;
// const filterTopic = 'webxr-site';
// const web3MainEndpoint = `https://${infuraNetwork}.infura.io/v3/${infuraProjectId}`;
// const tableName = 'users';
// const defaultAvatarPreview = `https://preview.exokit.org/[https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/male.vrm]/preview.png`;

Error.stackTraceLimit = 300;

(async () => {

const ipfsRepoLockPath = path.join(os.homedir(), '.ipfs', 'repo.lock');
try {
  fs.unlinkSync(ipfsRepoLockPath);
} catch (err) {
  if (err.code === 'ENOENT') {
    // nothing
  } else {
    console.warn(err.stack);
  }
}
const ipfsProcess = child_process.spawn('ipfs', [
  'daemon',
  '--writable',
]);
ipfsProcess.stdout.pipe(process.stdout);
ipfsProcess.stderr.pipe(process.stderr);
ipfsProcess.on('exit', code => {
  console.warn('ipfs exited', code);
});
process.on('exit', () => {
  ipfsProcess.kill(9);
});

const MAX_SIZE = 50 * 1024 * 1024;
const _handleIpfs = async (req, res) => {
  const _respond = (statusCode, body) => {
    res.statusCode = statusCode;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(body);
  };
  const _setCorsHeaders = res => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
  };

try {
    const {method} = req;
    const {query, pathname: p} = url.parse(req.url, true);

    // console.log('got ethereum', {method, p, query});

    if (method === 'GET') {
      const match = req.url.match(/^(?:\/ipfs)?\/([a-z0-9]+)(?:\/(.*))?$/i);
      if (match) {
        const proxy = httpProxy.createProxyServer({});
        req.url = '/ipfs/' + match[1];
        proxy
          .web(req, res, {
            target: 'http://127.0.0.1:8080',
            // secure: false,
            changeOrigin: true,
          }, err => {
            console.warn(err.stack);

            res.statusCode = 500;
            res.end();
          });
      } else {
        res.statusCode = 404;
        res.end();
      }
    } else if (method === 'POST') {
      const form = new FormData();
      form.append('file', req);
      form.submit('http://127.0.0.1:5001/api/v0/add', function(err, proxyRes) {
        if (!err) {
          if (proxyRes.statusCode >= 200 && proxyRes.statusCode < 300) {
            const bs = [];
            proxyRes.on('data', function(d) {
              bs.push(d);
            });
            proxyRes.on('end', function() {
              const b = Buffer.concat(bs);
              const s = b.toString('utf8');
              const j = JSON.parse(s);
              const {Hash} = j;
              res.end(JSON.stringify(Hash));
            });
          } else {
            res.statusCode = proxyRes.statusCode;
            proxyRes.pipe(res);
          }
        } else {
          res.statusCode = 500;
          res.end(err.stack);
        }
      });
    } else {
      _respond(500, JSON.stringify({
        error: err.stack,
      }));
    }
} catch(err) {
  console.warn(err);

  _respond(500, JSON.stringify({
    error: err.stack,
  }));
}
};

const _req = protocol => (req, res) => {
try {

  const o = url.parse(protocol + '//' + (req.headers['host'] || '') + req.url);
  let match;
  if (o.host === 'ipfs.exokit.org') {
    _handleIpfs(req, res);
    return;
  }

  res.statusCode = 404;
  res.end('host not found');
} catch(err) {
  console.warn(err.stack);

  res.statusCode = 500;
  res.end(err.stack);
}
};

const server = http.createServer(_req('http:'));
const server2 = https.createServer({
  cert: CERT,
  key: PRIVKEY,
}, _req('https:'));

const _warn = err => {
  console.warn('uncaught: ' + err.stack);
};
process.on('uncaughtException', _warn);
process.on('unhandledRejection', _warn);

server.listen(PORT);
server2.listen(443);

console.log(`http://127.0.0.1:${PORT}`);
console.log(`https://127.0.0.1:443`);

})();
