// @ts-check
const { create } = require('ipfs-http-client');

const ipfsClient = create();

function _parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let bodyJSON = {};
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        bodyJSON = JSON.parse(body);
        if (!bodyJSON) {
          bodyJSON = {};
        }
      } catch (error) {
        bodyJSON = {};
      }
      resolve(bodyJSON);
    });
  });
}


/* 
  *
  * Accepts data in format
  * body: {
  *   abi: [{
  *     path: '[path from directory e.g image/abc.jpg]',
  *     content: '[base64 encoded string]'
  *   }]
  * }
  *
*/
async function _handleUploadFolder(req, res) {
  const { method, headers } = req;
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
  _setCorsHeaders(res);
  if (method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const body = await _parseBody(req);

  if (!body.abi || !Array.isArray(body.abi)) {
    return _respond(400, JSON.stringify('Invalid params'));
  }


  for (const file of body.abi) {
    if (!file.path || !file.content) {
      return _respond(400, JSON.stringify('Invalid params'));
    }
  }

  const files = body.abi.map(file => {
    let content = Buffer.from(file.content, 'base64');
    return {
      path: file.path,
      content: content
    }
  });

  const ipfsResponses = [];

  for await (const result of ipfsClient.addAll(files, {
    wrapWithDirectory: true
  })) {
    ipfsResponses.push({
      path: result.path,
      cid: result.cid.toString()
    });
  }

  _respond(200, JSON.stringify({
    cid: ipfsResponses.pop().cid
  }));
}

module.exports = {
  _handleUploadFolder
};