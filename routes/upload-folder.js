// @ts-check
const { create } = require('ipfs-http-client');
const parseFormdata = require('parse-formdata');

const { MAX_SIZE } = require('../constants.js');

const ipfsClient = create();

function _parseBody(req) {
  return new Promise((resolve, reject) => {
    parseFormdata(req, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}


/* 
  *
  * Accepts formdata in format
  * body: {
  *   "file/relative/location/to/cid.jpg": "[file]"
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
  try {
    const body = await _parseBody(req);
    const files = body.parts.map(file => {
      return {
        path: file.name,
        content: file.stream,
      };
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
  } catch (error) {
    console.log(error);
    _respond(500, 'Something went wrong');
  }
}

module.exports = {
  _handleUploadFolder
};