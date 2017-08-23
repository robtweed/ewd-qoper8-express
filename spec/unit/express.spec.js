'use strict';

var events = require('events');
var rewire = require('rewire');
var mockRequest = require('./mocks/request');
var mockResponse = require('./mocks/response');
var mockExpress = require('./mocks/express');
var mockRouter = require('./mocks/router');
var qx = rewire('../../lib/express');

describe(' - unit/express:', function () {
  var MasterProcess;
  var q;

  beforeAll(function () {
    MasterProcess = function () {
      this.handleMessage = jasmine.createSpy();

      events.EventEmitter.call(this);
    };

    MasterProcess.prototype = Object.create(events.EventEmitter.prototype);
    MasterProcess.prototype.constructor = MasterProcess;
  });

  beforeEach(function () {
    q = new MasterProcess();
  });

  afterEach(function () {
    q.removeAllListeners();
    q = null;
  });

  describe('#build', function () {
    it('should return build no', function () {
      expect(qx.build).toEqual(jasmine.any(String));
    });
  });

  describe('#init', function () {
    it('should be function', function () {
      expect(qx.init).toEqual(jasmine.any(Function));
    });

    it('should initialize qoper8', function () {
      qx.init(q);

      expect(qx.__get__('qoper8')).toBe(q);
    });

    it('should not init workerResponseHandlers', function () {
      var workerResponseHandlers = {};
      q.workerResponseHandlers = workerResponseHandlers;

      qx.init(q);

      expect(q.workerResponseHandlers).toBe(workerResponseHandlers);
    });

    it('should init workerResponseHandlers', function () {
      expect(q.workerResponseHandlers).not.toBeDefined();

      qx.init(q);

      expect(q.workerResponseHandlers).toEqual({});
    });
  });

  describe('#addTo', function () {
    it('should be function', function () {
      expect(qx.addTo).toEqual(jasmine.any(Function));
    });

    it('should be init', function () {
      expect(qx.addTo).toBe(qx.init);
    });
  });

  describe('#router', function () {
    var handleMessage;
    var revertExpress;
    var revertHandleMessage;

    beforeEach(function () {
      revertExpress = qx.__set__('express', mockExpress.mock());
      handleMessage = jasmine.createSpy();
      revertHandleMessage = qx.__set__('handleMessage', handleMessage);
    });

    afterEach(function () {
      revertHandleMessage();
      revertExpress();
    });

    it('should be function', function () {
      expect(qx.router).toEqual(jasmine.any(Function));
    });

    it('should return router', function () {
      var router = qx.router();

      expect(router.route).toHaveBeenCalledWith(['/:type/*', '/:type']);
      expect(router.post).toHaveBeenCalledWith(jasmine.any(Function));
      expect(router.get).toHaveBeenCalledWith(jasmine.any(Function));
      expect(router.put).toHaveBeenCalledWith(jasmine.any(Function));
      expect(router.delete).toHaveBeenCalledWith(jasmine.any(Function));
    });

    describe('route', function () {
      describe('is string', function () {
        it('should use correct path', function () {
          var route = '/:type';

          var router = qx.router(route);

          expect(router.route).toHaveBeenCalledWith('/:type');
        });
      });

      describe('is object', function () {
        it('should use correct path', function () {
          var route = {
            route: '/:type'
          };

          var router = qx.router(route);

          expect(router.route).toHaveBeenCalledWith('/:type');
        });
      });
    });

    ['GET', 'POST', 'PUT', 'DELETE'].forEach(function (verb) {
      describe(verb, function () {
        var req;
        var res;
        var next;

        beforeEach(function () {
          req = mockRequest.mock();
          res = mockResponse.mock();
          next = jasmine.createSpy();
        });

        it('should call handleMessage', function () {
          var router = qx.router();
          router.handle(verb, req, res, next);

          expect(handleMessage).toHaveBeenCalledWith(req, res, null);
        });

        describe('application', function () {
          it('should set req.application', function () {
            var route = {
              route: '/:type',
              application: 'api'
            };

            var router = qx.router(route);
            router.handle(verb, req, res, next);

            expect(req.application).toBe('api');
          });
        });

        describe('expressType', function () {
          it('should set req.expressType', function () {
            var route = {
              route: '/:type',
              expressType: 'master'
            };

            var router = qx.router(route);
            router.handle(verb, req, res, next);

            expect(req.expressType).toBe('master');
          });
        });

        describe('nextCallback', function () {
          it('should set req.expressType', function () {
            var route = {
              route: '/:type',
              nextCallback: true
            };

            var router = qx.router(route);
            router.handle(verb, req, res, next);

            expect(handleMessage).toHaveBeenCalledWith(req, res, next);
          });
        });
      });
    });
  });

  describe('#handleMessage', function () {
    var req;
    var res;
    var next;

    beforeEach(function () {
      jasmine.clock().install();

      var nowUtc = new Date(Date.UTC(2017, 0, 1));
      jasmine.clock().mockDate(nowUtc);
    });

    beforeEach(function () {
      qx.init(q);

      req = mockRequest.mock();
      res = mockResponse.mock();
      next = jasmine.createSpy();
    });

    afterEach(function () {
      jasmine.clock().uninstall();
    });

    it('should be function', function () {
      expect(qx.handleMessage).toEqual(jasmine.any(Function));
    });

    describe('microServiceRouter', function () {
      var revert;

      beforeEach(function () {
        q.router = mockRouter.mock();

        /*jshint camelcase: false */
        q.u_services = require('./fixtures/servicesConfig');
        /*jshint camelcase: true */

        revert = qx.__set__('microServiceRouter', jasmine.createSpy());
      });

      afterEach(function () {
        revert();
      });

      it('should call microServiceRouter with correct arguments', function () {
        var callback = qx.__get__('microServiceRouter');

        qx.handleMessage(req, res, next);

        expect(callback).toHaveBeenCalledWith({
          type: 'ewd-qoper8-express',
          path: req.originalUrl,
          method: req.method,
          headers: req.headers,
          params: req.params,
          query: req.query,
          body: req.body,
          ip: req.ip,
          ips: req.ips
        }, jasmine.any(Function));
      });

      describe('routed', function () {
        it('should not call qoper8.handleMessage', function () {
          var callback = qx.__get__('microServiceRouter');
          callback.and.returnValue(true);

          qx.handleMessage(req, res, next);

          expect(q.handleMessage).not.toHaveBeenCalled();
        });
      });

      describe('not routed', function () {
        it('should not call qoper8.handleMessage', function () {
          var callback = qx.__get__('microServiceRouter');
          callback.and.returnValue(false);

          qx.handleMessage(req, res, next);

          expect(q.handleMessage).toHaveBeenCalled();
        });
      });
    });

    it('should call qoper8.handleMessage with correct arguments', function () {
      qx.handleMessage(req, res, next);

      expect(q.handleMessage).toHaveBeenCalledWith({
        type: 'ewd-qoper8-express',
        path: req.originalUrl,
        method: req.method,
        headers: req.headers,
        params: req.params,
        query: req.query,
        body: req.body,
        ip: req.ip,
        ips: req.ips
      }, jasmine.any(Function));
    });

    describe('req.baseUrl', function () {
      beforeEach(function () {
        req.baseUrl = '/users';
      });

      it('should add application prop to message object', function () {
        qx.handleMessage(req, res, next);

        var args = q.handleMessage.calls.argsFor(0);

        expect(args[0].application).toBe('users');
      });
    });

    describe('req.application', function () {
      beforeEach(function () {
        req.application = 'messages';
      });

      it('should add application prop to message object', function () {
        qx.handleMessage(req, res, next);

        var args = q.handleMessage.calls.argsFor(0);

        expect(args[0].application).toBe('messages');
      });
    });

    describe('req.params.type', function () {
      beforeEach(function () {
        req.params.type = 'master';
      });

      it('should add expressType prop to message object', function () {
        qx.handleMessage(req, res, next);

        var args = q.handleMessage.calls.argsFor(0);

        expect(args[0].expressType).toBe('master');
      });
    });

    describe('req.expressType', function () {
      beforeEach(function () {
        req.expressType = 'worker';
      });

      it('should add application prop to message object', function () {
        qx.handleMessage(req, res, next);

        var args = q.handleMessage.calls.argsFor(0);

        expect(args[0].expressType).toBe('worker');
      });
    });

    describe('handleResponse', function () {
      var resultObj;
      var timeout = 5 * 1000;

      beforeEach(function () {
        resultObj = {
          message: {}
        };
      });

      afterEach(function () {
        resultObj = null;
      });

      describe('socketId', function () {
        beforeEach(function () {
          resultObj.socketId = '/#yf_vd-S9Q7e-LX28AAAS';
        });

        it('should do nothing', function () {
          qx.handleMessage(req, res, next);
          jasmine.clock().tick(timeout);

          var handleResponse = q.handleMessage.calls.argsFor(0)[1];
          handleResponse(resultObj);

          expect(next).not.toHaveBeenCalled();
          expect(res.send).not.toHaveBeenCalled();
        });
      });

      it('should set X-ResponseTime header', function () {
        qx.handleMessage(req, res, next);
        jasmine.clock().tick(timeout);

        var handleResponse = q.handleMessage.calls.argsFor(0)[1];
        handleResponse(resultObj);

        expect(res.set).toHaveBeenCalledWith('X-ResponseTime', '5000ms');
      });

      describe('When next callback passed', function () {
        it('should call next callback', function () {
          qx.handleMessage(req, res, next);
          jasmine.clock().tick(timeout);

          var handleResponse = q.handleMessage.calls.argsFor(0)[1];
          handleResponse(resultObj);

          expect(res.locals.message).toBe(resultObj.message);
          expect(next).toHaveBeenCalled();
        });
      });

      describe('When next callback NOT passed', function () {
        it('should call res.send', function () {
          qx.handleMessage(req, res);
          jasmine.clock().tick(timeout);

          var handleResponse = q.handleMessage.calls.argsFor(0)[1];
          handleResponse(resultObj);

          expect(res.send).toHaveBeenCalledWith(resultObj.message);
          expect(next).not.toHaveBeenCalled();
        });
      });

      describe('restMessage', function () {
        beforeEach(function () {
          resultObj.message.restMessage = {};
        });

        it('should delete message.restMessage', function () {
          qx.handleMessage(req, res, next);
          jasmine.clock().tick(timeout);

          var handleResponse = q.handleMessage.calls.argsFor(0)[1];
          handleResponse(resultObj);

          expect(res.locals.message.restMessage).not.toBeDefined();
        });
      });

      describe('ewd_application', function () {
        beforeEach(function () {
          /*jshint camelcase: false */
          resultObj.message = {
            type: 'foo',
            ewd_application: process.cwd() + '/spec/unit/fixtures/module'
          };
          /*jshint camelcase: true */
        });

        describe('workerResponseHandlers', function () {
          it('should load worker response intercept handler module', function () {
            qx.handleMessage(req, res, next);
            jasmine.clock().tick(timeout);

            var handleResponse = q.handleMessage.calls.argsFor(0)[1];
            handleResponse(resultObj);

            expect(res.locals.message).toEqual({
              type: 'foo',
              module: true
            });
          });
        });
      });

      describe('message.error', function () {
        beforeEach(function () {
          resultObj.message.error = 'foo';
        });

        describe('When next callback passed', function () {
          it('should call next', function () {
            qx.handleMessage(req, res, next);
            jasmine.clock().tick(timeout);

            var handleResponse = q.handleMessage.calls.argsFor(0)[1];
            handleResponse(resultObj);

            expect(res.locals.message).toBe(resultObj.message);
            expect(next).toHaveBeenCalled();
          });
        });

        describe('When next callback NOT passed', function () {
          it('should set X-ResponseTime header', function () {
            qx.handleMessage(req, res);
            jasmine.clock().tick(timeout);

            var handleResponse = q.handleMessage.calls.argsFor(0)[1];
            handleResponse(resultObj);

            expect(res.set).toHaveBeenCalledWith('X-ResponseTime', '5000ms');
          });

          it('should send response', function () {
            qx.handleMessage(req, res);
            jasmine.clock().tick(timeout);

            var handleResponse = q.handleMessage.calls.argsFor(0)[1];
            handleResponse(resultObj);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
              error: 'foo'
            });
          });

          describe('custom status code', function () {
            beforeEach(function () {
              resultObj.message.status = {
                code: 500
              };
            });

            it('should send custom status code', function () {
              qx.handleMessage(req, res);
              jasmine.clock().tick(timeout);

              var handleResponse = q.handleMessage.calls.argsFor(0)[1];
              handleResponse(resultObj);

              expect(res.status).toHaveBeenCalledWith(500);
            });
          });

          describe('custom error response', function () {
            beforeEach(function () {
              resultObj.message.error = {
                response: 'bar'
              };
            });

            it('should send custom error response', function () {
              qx.handleMessage(req, res);
              jasmine.clock().tick(timeout);

              var handleResponse = q.handleMessage.calls.argsFor(0)[1];
              handleResponse(resultObj);

              expect(res.send).toHaveBeenCalledWith('bar');
            });
          });
        });
      });
    });
  });

  describe('#workerMessage', function () {
    var messageObj;
    var send;
    var finished;

    beforeEach(function () {
      messageObj = {};
      send = jasmine.createSpy();
      finished = jasmine.createSpy();
    });

    it('should be function', function () {
      expect(qx.workerMessage).toEqual(jasmine.any(Function));
    });

    describe('When type is ewd-qoper8-express', function () {
      beforeEach(function () {
        messageObj.type = 'ewd-qoper8-express';
        messageObj.path = '/qoper8/test';
      });

      it('should return true', function () {
        var actual = qx.workerMessage.call(q, messageObj, send, finished);

        expect(actual).toBeTruthy();
      });

      describe('unknownExpressMessage', function () {
        it('should add event handler', function () {
          spyOn(q, 'on').and.callThrough();

          qx.workerMessage.call(q, messageObj, send, finished);

          expect(q.on).toHaveBeenCalledWith('unknownExpressMessage', jasmine.any(Function));
        });
      });

      it('should emit `expressMessage` event', function () {
        spyOn(q, 'emit').and.callThrough();

        var callback = jasmine.createSpy();
        q.on('expressMessage', callback);

        qx.workerMessage.call(q, messageObj, send, finished);

        expect(q.emit.calls.count()).toBe(1);
        expect(q.emit).toHaveBeenCalledWith('expressMessage', messageObj, send, finished);
        expect(callback).toHaveBeenCalledWith(messageObj, send, finished);
      });

      describe('and no handler for `expressMessage` event found', function () {
        it('should emit `unknownExpressMessage` event', function () {
          spyOn(q, 'emit').and.callThrough();

          qx.workerMessage.call(q, messageObj, send, finished);

          expect(q.emit.calls.count()).toBe(2);
          expect(q.emit.calls.argsFor(1)).toEqual(['unknownExpressMessage', messageObj, send, finished]);
          expect(finished).toHaveBeenCalledWith({
            error: 'No handler found for /qoper8/test request'
          });
        });
      });
    });

    it('should return false', function () {
      var actual = qx.workerMessage.call(q, messageObj, send, finished);

      expect(actual).toBeFalsy();
    });
  });

});
