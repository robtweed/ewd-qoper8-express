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

  27 January 2016

*/

var qoper8;
var router = require('express').Router();

function init(q) {

  qoper8 = q;

/*
  q.on('beforeDispatch', function(requestObj, pid) {
    if (requestObj.callback) {
      q.responseHandler[pid] = requestObj.callback;
      delete requestObj.callback;
    }
  });

  q.on('response', function(responseObj, pid) {
    if (q.responseHandler && q.responseHandler[pid]) {
      q.responseHandler[pid](responseObj);
      delete q.responseHandler[pid];
    }
  });

*/

}

/*
function handleMessage(message, callback) {
  message.callback = callback;
  qoper8.addToQueue(message);
}
*/

function qrouter(route) {
  route = route || ['/:type/*', '/:type'];

  router.route(route)

  .post(function(req, res) {
    var message = {
      type: req.baseUrl.slice(1) + '.' + req.params.type,
      method: req.method,
      headers: req.headers,
      params: req.params,
      path: req.params['0'],
      query: req.query,
      content: req.body
    };
    qoper8.handleMessage(message, function(resultObj) {
      res.send(resultObj.message);
    });
  })
  .get(function(req, res) {
    var message = {
      type: req.baseUrl.slice(1) + '.' + req.params.type,
      method: req.method,
      headers: req.headers,
      params: req.params,
      path: req.params['0'],
      query: req.query
    };
    qoper8.handleMessage(message, function(resultObj) {
      //delete resultObj.finished;
      res.send(resultObj.message);
    });
  });

  return router;
}

function workerMessage(messageObj) {

  var worker = this;

  function send(results) {
    worker.returnMessage(messageObj.type, results);
  }

  function finished(results) {
    worker.hasFinished(messageObj.type, results);
  }
  var status = this.emit('expressMessage', messageObj, send, finished);
  if (!status) {
    var ok = this.emit(messageObj.type, messageObj, send, finished);
    if (!ok) {
      var results = {
        error: 'No handler found for ' + messageObj.type + ' message'
      };
      this.hasFinished(messageObj.type, results);
    }
  }
}

module.exports = {
  init: init,
  //handleMessage: handleMessage,
  router: qrouter,
  workerMessage, workerMessage
};
