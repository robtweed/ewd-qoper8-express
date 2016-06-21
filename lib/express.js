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

  21 June 2016

*/

var build = '3.5.0';

//var router = require('express').Router();
var express = require('express');
var qoper8;

function init(q) {
  qoper8 = q;
}

//var util = require('util');

function handleMessage(req, res, next) {
  /*
  console.log('***************');
  console.log(util.inspect(req));
  console.log('***************');
  */
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
      if (next) {
        res.locals.message = message;
        next();
        return;
      }
      else {
        var code = 400;
        var status = message.status;
        if (status && status.code) code = status.code;
        res.status(code).send({error: message.error});
      }
    }
    else {
      // intercept response for further processing / augmentation of message response on master process if required
      var application = message.ewd_application;
      if (application) {
        var type = resultObj.type;
        if (type && qoper8.workerResponseHandler && qoper8.workerResponseHandler[application] && qoper8.workerResponseHandler[application][type]) message = qoper8.workerResponseHandler[application][type](message);
        delete message.ewd_application;
      }
      if (message.restMessage) {
        delete message.restMessage;
        delete message.type;
      }
      if (next) {
        res.locals.message = message;
        next();
        return;
      }
      else {
        res.send(message);
      }
    }
  });
}

function qrouter(route) {
  var router = express.Router();
  var nextCallback = false;

  if (typeof route === 'object') {
    if (route.nextCallback === true) nextCallback = true;
    route = route.route;
  }
  route = route || ['/:type/*', '/:type'];

  router.route(route)

  .post(function(req, res, next) {
    handleMessage(req, res, nextCallback ? next : null);
  })
  .get(function(req, res, next) {
    handleMessage(req, res, nextCallback ? next : null);
  })
  .put(function(req, res, next) {
    handleMessage(req, res, nextCallback ? next : null);
  })
  .delete(function(req, res, next) {
    handleMessage(req, res, nextCallback ? next : null);
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
  build: build,
  init: init,
  addTo: init,
  router: qrouter,
  handleMessage: handleMessage,
  workerMessage: workerMessage
};
