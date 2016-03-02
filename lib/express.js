/*

 ----------------------------------------------------------------------------
 | ewd-qoper8-express: Express Integration Module for ewd-qpoper8           |
 |                                                                          |
 | Copyright (c) 2016 M/Gateway Developments Ltd,                           |
 | Reigate, Surrey UK.                                                      |
 | All rights reserved.                                                     |
 |                                                                          |
 | http://www.mgateway.com                                                  |
 | Email: rtweed@mgateway.com                                               |
 |                                                                          |
 |                                                                          |
 | Licensed under the Apache License, Version 2.0 (the "License");          |
 | you may not use this file except in compliance with the License.         |
 | You may obtain a copy of the License at                                  |
 |                                                                          |
 |     http://www.apache.org/licenses/LICENSE-2.0                           |
 |                                                                          |
 | Unless required by applicable law or agreed to in writing, software      |
 | distributed under the License is distributed on an "AS IS" BASIS,        |
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. |
 | See the License for the specific language governing permissions and      |
 |  limitations under the License.                                          |
 ----------------------------------------------------------------------------

  1 March 2016

*/

var router = require('express').Router();
var qoper8;

function init(q) {
  qoper8 = q;
}

function handleMessage(req, res) {
  var message = {
    type: 'ewd-qoper8-express',
    path: req.originalUrl,
    method: req.method,
    headers: req.headers,
    params: req.params,
    query: req.query,
    body: req.body
  };
  if (req.baseUrl && req.baseUrl !== '') {
    message.application = req.baseUrl.split('/')[1];
  }
  if (req.params && req.params.type) {
    message.expressType = req.params.type;
  }
  qoper8.handleMessage(message, function(resultObj) {
    var message = resultObj.message;
    if (message.error) {
      var code = 400;
      var status = message.status;
      if (status && status.code) code = status.code;
      res.status(code).send({error: message.error});
      //res.status(code);
      //res.render('error', {error: message.error});
    }
    else {
      res.send(message);
    }
  });
}

function qrouter(route) {
  route = route || ['/:type/*', '/:type'];

  router.route(route)

  .post(function(req, res) {
    handleMessage(req, res);
  })
  .get(function(req, res) {
    handleMessage(req, res);
  })
  .put(function(req, res) {
    handleMessage(req, res);
  })
  .delete(function(req, res) {
    handleMessage(req, res);
  });

  return router;
}

function workerMessage(messageObj, send, finished) {
  if (messageObj.type !== 'ewd-qoper8-express') return false;

  this.on('unknownExpressMessage', function(messageObj, send, finished) {
    var results = {
      error: 'No handler found for ' + messageObj.path + ' request'
    };
    finished(results);
  });

  var ok = this.emit('expressMessage', messageObj, send, finished);
  
  if (!ok) this.emit('unknownExpressMessage', messageObj, send, finished);
  return true;
}

module.exports = {
  init: init,
  addTo: init,
  router: qrouter,
  handleMessage: handleMessage,
  workerMessage: workerMessage
};
