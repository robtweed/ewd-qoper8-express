'use strict';

var events = require('events');
var mockery = require('mockery');
var rewire = require('rewire');
var mockRequest = require('./mocks/request');
var mockResponse = require('./mocks/response');
var mockExpress = require('./mocks/express');
var mockRouter = require('./mocks/router');
var qx = rewire('../../lib/express');
var handleResponseErrorSpec = require('./shared/handleResponseErrorSpec');

describe('unit/express:', function () {
  var MasterProcess;
  var q;

  var revert = function (obj) {
    obj.__revert__();
    delete obj.__revert__;
  };

  beforeAll(function () {
    MasterProcess = function () {
      this.handleMessage = jasmine.createSpy();
      this.userDefined = {
        config: {
          moduleMap: {
            quuxbaz: 'quux'
          }
        }
      };

      events.EventEmitter.call(this);
    };

    MasterProcess.prototype = Object.create(events.EventEmitter.prototype);
    MasterProcess.prototype.constructor = MasterProcess;

    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false
    });
  });

  afterAll(function () {
    mockery.disable();
  });

  beforeEach(function () {
    q = new MasterProcess();
  });

  afterEach(function () {
    q.removeAllListeners();
    q = null;

    mockery.deregisterAll();
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

    describe('workerResponseHandlers', function () {
      it('should be initialized for qoper8', function () {
        expect(q.workerResponseHandlers).toBeUndefined();

        qx.init(q);

        expect(q.workerResponseHandlers).toEqual({});
      });

      it('should be not initialized for qoper8', function () {
        var workerResponseHandlers = q.workerResponseHandlers = {};

        qx.init(q);

        expect(q.workerResponseHandlers).toBe(workerResponseHandlers);
      });
    });

    describe('microServiceRouter', function () {
      var revert;

      beforeEach(function () {
        revert = qx.__set__('microServiceRouter', jasmine.createSpy());
      });

      afterEach(function () {
        revert();
      });

      it('should be attached to qoper8', function () {
        var callback = qx.__get__('microServiceRouter');

        expect(q.microServiceRouter).toBeUndefined();

        qx.init(q);

        expect(q.microServiceRouter).toBe(callback);
      });
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
    var express;
    var handleMessage;

    beforeEach(function () {
      express = mockExpress.mock();
      express.__revert__ = qx.__set__('express', express);

      handleMessage = jasmine.createSpy();
      handleMessage.__revert__ = qx.__set__('handleMessage', handleMessage);
    });

    afterEach(function () {
      revert(express);
      revert(handleMessage);
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

    ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].forEach(function (verb) {
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
      var microServiceRouter;

      beforeEach(function () {
        q.router = mockRouter.mock();

        /*jshint camelcase: false */
        q.u_services = require('./fixtures/servicesConfig');
        /*jshint camelcase: true */

        microServiceRouter = jasmine.createSpy();
        microServiceRouter.__revert__ = qx.__set__('microServiceRouter', microServiceRouter);
      });

      afterEach(function () {
        revert(microServiceRouter);
      });

      it('should call microServiceRouter with correct arguments', function () {
        qx.handleMessage(req, res, next);

        expect(microServiceRouter).toHaveBeenCalledWithContext(q, {
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

      var boot = function (cb) {
        cb(qx, q, req, res, next, timeout);
      };

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

          expect(res.locals.message.restMessage).toBeUndefined();
        });
      });

      describe('ewd_application', function () {
        beforeEach(function () {
          req.params.type = 'baz';
        });

        describe('workerResponseHandlers', function () {
          it('should load worker response handlers from application module', function () {
            var appModule = {
              workerResponseHandlers: jasmine.createSpyObj(['baz'])
            };

            /*jshint camelcase: false */
            appModule.workerResponseHandlers.baz.and.returnValue({
              type: 'foo2',
              ewd_application: 'quux2'
            });
            /*jshint camelcase: true */

            mockery.registerMock('quux', appModule);

            /*jshint camelcase: false */
            resultObj.message = {
              type: 'foo',
              ewd_application: 'quux'
            };
            /*jshint camelcase: true */

            qx.handleMessage(req, res, next);
            jasmine.clock().tick(timeout);

            var handleResponse = q.handleMessage.calls.argsFor(0)[1];
            handleResponse(resultObj);

            expect(appModule.workerResponseHandlers.baz).toHaveBeenCalledWithContext(q, resultObj.message, req);
            expect(res.locals.message).toEqual({
              type: 'foo2'
            });
          });

          it('should load worker response handlers from application module using moduleMap', function () {
            var appModule = {
              workerResponseHandlers: jasmine.createSpyObj(['baz'])
            };

            /*jshint camelcase: false */
            appModule.workerResponseHandlers.baz.and.returnValue({
              type: 'foo2',
              ewd_application: 'quux2'
            });
            /*jshint camelcase: true */

            mockery.registerMock('quux', appModule);

            /*jshint camelcase: false */
            resultObj.message = {
              type: 'foo',
              ewd_application: 'quuxbaz'
            };
            /*jshint camelcase: true */

            qx.handleMessage(req, res, next);
            jasmine.clock().tick(timeout);

            var handleResponse = q.handleMessage.calls.argsFor(0)[1];
            handleResponse(resultObj);

            expect(appModule.workerResponseHandlers.baz).toHaveBeenCalledWithContext(q, resultObj.message, req);
            expect(res.locals.message).toEqual({
              type: 'foo2'
            });
          });

          it('should use default worker response handlers from application module', function () {
            var appModule = {};

            mockery.registerMock('quux', appModule);

            /*jshint camelcase: false */
            resultObj.message = {
              type: 'foo',
              ewd_application: 'quux'
            };
            /*jshint camelcase: true */

            qx.handleMessage(req, res, next);
            jasmine.clock().tick(timeout);

            var handleResponse = q.handleMessage.calls.argsFor(0)[1];
            handleResponse(resultObj);

            expect(res.locals.message).toEqual({
              type: 'foo'
            });
          });

          it('should unable to load application module', function () {
            /*jshint camelcase: false */
            resultObj.message = {
              type: 'foo',
              ewd_application: 'quux'
            };
            /*jshint camelcase: true */

            qx.handleMessage(req, res, next);
            jasmine.clock().tick(timeout);

            var handleResponse = q.handleMessage.calls.argsFor(0)[1];
            handleResponse(resultObj);

            expect(q.workerResponseHandlers).toEqual({
              quux: {}
            });
          });

          it('should use loaded application module', function () {
            var appHandlers = jasmine.createSpyObj(['baz']);

            /*jshint camelcase: false */
            appHandlers.baz.and.returnValue({
              type: 'foo2',
              ewd_application: 'quux2'
            });
            /*jshint camelcase: true */

            q.workerResponseHandlers = {
              quux: appHandlers
            };

            /*jshint camelcase: false */
            resultObj.message = {
              type: 'foo',
              ewd_application: 'quux'
            };
            /*jshint camelcase: true */

            qx.handleMessage(req, res, next);
            jasmine.clock().tick(timeout);

            var handleResponse = q.handleMessage.calls.argsFor(0)[1];
            handleResponse(resultObj);

            expect(appHandlers.baz).toHaveBeenCalledWithContext(q, resultObj.message, req);
          });
        });
      });

      describe('error handling', function () {
        var config = {
          'When resultObj.message.error': {
            nextCallback: true,
            getResultObj: function () {
              return {
                message: {
                  error: 'foo'
                }
              };
            },
            getExpectedObj: function () {
              return {
                error: 'foo'
              };
            },
            decorators: {
              statusCode: function (resultObj) {
                resultObj.message.status = {
                  code: 500
                };

                return resultObj.message.status.code;
              },
              response: function (resultObj) {
                resultObj.message.error = {
                  response: 'bar'
                };

                return resultObj.message.error.response;
              }
            }
          },
          'When only resultObj.error': {
            nextCallback: true,
            getResultObj: function () {
              return {
                error: 'bar'
              };
            },
            getExpectedObj: function () {
              return {
                  error: 'bar'
              };
            }
          },
          'When resultObj.message undefined': {
            nextCallback: false,
            getResultObj: function () {
              return {};
            },
            getExpectedObj: function () {
              return {
                error: 'Invalid or missing response'
              };
            },
          },
          'When resultObj.message.error and resultObj.status': {
            nextCallback: true,
            getResultObj: function () {
              return {
                message: {
                  error: 'foo'
                }
              };
            },
            getExpectedObj: function () {
              return {
                error: 'foo'
              };
            },
            decorators: {
              statusCode: function (resultObj) {
                resultObj.status = {
                  code: 403
                };

                return resultObj.status.code;
              }
            }
          }
        };

        Object.keys(config).forEach(function (name) {
          handleResponseErrorSpec(name, boot, config[name]);
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
