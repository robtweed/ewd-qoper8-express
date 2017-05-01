/*

 ----------------------------------------------------------------------------
 | ewd-qoper8-express: Express Integration Module for ewd-qpoper8           |
 |                                                                          |
 | Copyright (c) 2016-17 M/Gateway Developments Ltd,                        |
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

  29 April 2017

*/

var build = '3.11.0';

//var router = require('express').Router();
var express = require('express');
var qoper8;

function init(q) {
  qoper8 = q;
  if (!qoper8.workerResponseHandlers) qoper8.workerResponseHandlers = {};
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
    body: req.body,
    ip: req.ip,
    ips: req.ips
  };
  if (req.baseUrl && req.baseUrl !== '') {
    message.application = req.baseUrl.split('/')[1];
  }
  if (req.application) message.application = req.application;
  if (req.params && req.params.type) {
    message.expressType = req.params.type;
  }
  if (req.expressType) message.expressType = req.expressType;
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
        var response = {error: message.error};
        if (message.error.response) response = message.error.response
        res.status(code).send(response);
      }
    }
    else {
      // intercept response for further processing / augmentation of message response on master process if required
      var application = message.ewd_application;
      if (application) {
        if (!qoper8.workerResponseHandlers[application]) {
          try {
            qoper8.workerResponseHandlers[application] = require(application).workerResponseHandlers || {};
          }
          catch(err) {
            var error = 'Unable to load worker response intercept handler module for: ' + application;
            console.log(error);
            qoper8.workerResponseHandlers[application] = {};
          }
        }


        var type = message.type;
        //if (type && qoper8.workerResponseHandler && qoper8.workerResponseHandler[application] && qoper8.workerResponseHandler[application][type]) message = qoper8.workerResponseHandler[application][type](message);
        if (type && qoper8.workerResponseHandlers && qoper8.workerResponseHandlers[application] && qoper8.workerResponseHandlers[application][type]) message = qoper8.workerResponseHandlers[application][type].call(qoper8, message);
        delete message.ewd_application;
      }
      if (message.restMessage) {
        delete message.restMessage;
        //delete message.type;
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
  var application;
  var expressType;

  if (typeof route === 'object') {
    if (route.nextCallback === true) nextCallback = true;
    if (route.application) application = route.application;
    if (route.expressType) expressType = route.expressType;
    route = route.route;
  }
  route = route || ['/:type/*', '/:type'];

  router.route(route)

  .post(function(req, res, next) {
    if (application) req.application = application;
    if (expressType) req.expressType = expressType;
    handleMessage(req, res, nextCallback ? next : null);
  })
  .get(function(req, res, next) {
    if (application) req.application = application;
    if (expressType) req.expressType = expressType;
    handleMessage(req, res, nextCallback ? next : null);
  })
  .put(function(req, res, next) {
    if (application) req.application = application;
    if (expressType) req.expressType = expressType;
    handleMessage(req, res, nextCallback ? next : null);
  })
  .delete(function(req, res, next) {
    if (application) req.application = application;
    if (expressType) req.expressType = expressType;
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
