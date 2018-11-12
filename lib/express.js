/*

 ----------------------------------------------------------------------------
 | ewd-qoper8-express: Express Integration Module for ewd-qoper8            |
 |                                                                          |
 | Copyright (c) 2016-18 M/Gateway Developments Ltd,                        |
 | Redhill, Surrey UK.                                                      |
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

  12 November 2018

  Thanks to Ward DeBacker for patch method addition
  Thanks also to Alexey Kucherenko

*/

var pkg = require('../package.json');
var build = pkg.version;

var express = require('express');
var microServiceRouter = require('qewd-microservice-router');
var debug = require('debug')('ewd-qoper8-express');

var qoper8;

function init(q) {
  qoper8 = q;
  if (!qoper8.workerResponseHandlers) qoper8.workerResponseHandlers = {};
  qoper8.microServiceRouter = microServiceRouter;
}

function handleMessage(req, res, next) {
  var startTime = new Date();

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

  debug('request message: %s', JSON.stringify(message));

  if (req.baseUrl && req.baseUrl !== '') {
    message.application = req.baseUrl.split('/')[1];
  }
  if (req.application) message.application = req.application;
  if (req.params && req.params.type) {
    message.expressType = req.params.type;
  }
  if (req.expressType) message.expressType = req.expressType;

  var handleResponse = function(resultObj) {

    //console.log('ewd-oper8-express handleResponse: resultObj = ' + JSON.stringify(resultObj));

    debug('resultObj: %s', JSON.stringify(resultObj));

    // ignore socket-specific messages: they're handled separately
    if (resultObj.socketId && resultObj.socketId !== '') return;

    if (!resultObj.message && resultObj.error) resultObj = {
      message: resultObj
    };

    var message = resultObj.message;
    var code;
    var response;
    var headerName;
    var cookie;
    var directives;

    debug('response message: %s', JSON.stringify(message));

    if (typeof message === 'undefined') {
      code = 400;
      response = {error: 'Invalid or missing response'};
      res.set('X-ResponseTime', (Date.now() - startTime) + 'ms');
      res.status(code).send(response);
      return;
    }

    if (message.error && resultObj.status) message.status = resultObj.status;

    if (message.error) {
      if (next) {
        res.locals.message = message;
        next();
        return;
      }
      else {
        code = 400;
        var status = message.status;
        if (status && status.code) code = status.code;
        response = {error: message.error};
        if (message.error.response) response = message.error.response;
        res.set('X-ResponseTime', (Date.now() - startTime) + 'ms');
        res.status(code).send(response);
      }
    }
    else {
      // intercept response for further processing / augmentation of message response on master process if required
      var application = message.ewd_application;

      if (application) {
        if (typeof qoper8.workerResponseHandlers[application] === 'undefined') {
          var moduleName = application;
          if (qoper8.userDefined && qoper8.userDefined.config && qoper8.userDefined.config.moduleMap && qoper8.userDefined.config.moduleMap[application]) {
            moduleName = qoper8.userDefined.config.moduleMap[application];
          }

          try {
            qoper8.workerResponseHandlers[application] = require(moduleName).workerResponseHandlers || {};
          }
          catch(err) {
            debug('No worker response intercept handler module for %s or unable to load it', application);
            qoper8.workerResponseHandlers[application] = {};
          }
        }

        var type = req.params.type;
        if (type && qoper8.workerResponseHandlers && qoper8.workerResponseHandlers[application] && qoper8.workerResponseHandlers[application][type]) {
          message = qoper8.workerResponseHandlers[application][type].call(qoper8, message);
        }

        delete message.ewd_application;
      }

      if (message.restMessage) {

        // check for response header / set-cookie directives

        if (typeof message.qewd_response_headers === 'object') {
          for (headerName in message.qewd_response_headers) {
            res.set(headerName, message.qewd_response_headers[headerName]);
          }
          delete message.qewd_response_headers;
        }

        if (typeof message.qewd_send_jwt_as_cookie === 'object' && message.token) {

          // move JWT from response to a Set-Cookie header

          cookie = message.qewd_send_jwt_as_cookie.name || 'JSESSIONID';
          cookie = cookie + '=' + message.token;
          directives = message.qewd_send_jwt_as_cookie.directives;
          if (directives && Array.isArray(directives)) {
            directives.forEach(function(directive) {
              cookie = cookie + '; ' + directive;
            });
          }
          else {
            cookie = cookie + '; path=/';
          }
          res.set('Set-Cookie', cookie);
          delete message.token;
          delete message.qewd_send_jwt_as_cookie;
        }

        delete message.restMessage;
      }

      if (resultObj.type === 'restRequest' && resultObj.ms_requestId) {

        // This is a MicroService response - check for headers / cookie instructions

        if (typeof message.qewd_response_headers === 'object') {
          for (headerName in message.qewd_response_headers) {
            res.set(headerName, message.qewd_response_headers[headerName]);
          }
          delete message.qewd_response_headers;
        }

        if (typeof message.qewd_send_jwt_as_cookie === 'object') {

          // move JWT from response to a Set-Cookie header

          cookie = message.qewd_send_jwt_as_cookie.name || 'JSESSIONID';
          cookie = cookie + '=' + message.token;
          directives = message.qewd_send_jwt_as_cookie.directives;
          if (directives && Array.isArray(directives)) {
            directives.forEach(function(directive) {
              cookie = cookie + '; ' + directive;
            });
          }
          else {
            cookie = cookie + '; path=/';
          }
          res.set('Set-Cookie', cookie);
          delete message.token;
          delete message.qewd_send_jwt_as_cookie;
        }
      }

      res.set('X-ResponseTime', (Date.now() - startTime) + 'ms');

      if (next) {
        res.locals.message = message;
        next();
        return;
      }
      else {
        res.send(message);
      }
    }
  };

  // should this message be forwarded to a different QEWD Micro-service system?
  if (qoper8.router && qoper8.u_services.byDestination) {
    debug('the message is being forwarded to QEWD Micro-service system');
    var routed = microServiceRouter.call(qoper8, message, handleResponse);
    if (routed) return;
  }

  debug('handling message');
  qoper8.handleMessage(message, handleResponse);
}

function qrouter(route) {
  var router = express.Router();
  var nextCallback = false;
  var application;
  var expressType;

  debug('route: %s', JSON.stringify(route));

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
    .patch(function(req, res, next) {
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
  debug('worker message: %s', JSON.stringify(messageObj));

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
