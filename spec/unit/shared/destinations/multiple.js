'use strict';

module.exports = function (boot) {
  var q;
  var messageObj;
  var handleResponse;

  return {
    whenNoTokenIsReturned: function () {
      beforeEach(function (done) {
        boot(function (_q, _messageObj, _handleResponse) {
          q = _q;
          messageObj = _messageObj;
          handleResponse = _handleResponse;

          done();
        });
      });

      it('should call updateJWTExpiry with correct arguments', function () {
        q.microServiceRouter(messageObj, handleResponse);

        expect(q.jwt.handlers.updateJWTExpiry.calls.count()).toBe(2);
        expect(q.jwt.handlers.updateJWTExpiry.calls.argsFor(0)).toEqual(['token4', 'sms-micro-service']);
        expect(q.jwt.handlers.updateJWTExpiry.calls.argsFor(1)).toEqual(['token5', 'log-micro-service']);
      });
    },

    whenNoTokenIsNotReturned: function () {
      beforeEach(function (done) {
        boot(function (_q, _messageObj, _handleResponse) {
          q = _q;
          messageObj = _messageObj;
          handleResponse = _handleResponse;

          done();
        });
      });

      it('should call handleResponse with error response object', function () {

        /*jshint camelcase: false */
        var expected = {
          type: 'hello',
          message: {
            destinations: {
              sms_service: {
                message: {
                  error: 'JWT token is invalid'
                }
              },
              log_service: {
                message: {
                  error: 'JWT token is invalid'
                }
              },
            },
            token: undefined
          }
        };
        /*jshint camelcase: true */

        q.jwt.handlers.isJWTValid.and.returnValue({
          ok: false,
          error: 'JWT token is invalid'
        });

        q.microServiceRouter(messageObj, handleResponse);

        expect(handleResponse).toHaveBeenCalledWith(expected);
      });

      it('should call updateJWTExpiry 2 times with with correct arguments', function () {
        q.jwt.handlers.isJWTValid.and.returnValue({
          ok: true
        });

        q.microServiceRouter(messageObj, handleResponse);

        expect(q.jwt.handlers.updateJWTExpiry.calls.count()).toBe(2);
        expect(q.jwt.handlers.updateJWTExpiry.calls.argsFor(0)).toEqual(['jwt-token', 'sms-micro-service']);
        expect(q.jwt.handlers.updateJWTExpiry.calls.argsFor(1)).toEqual(['jwt-token', 'log-micro-service']);
      });
    },

    shouldCallMicroServiceClientSendMethod: function () {
      beforeEach(function (done) {
        boot(function (_q, _messageObj, _handleResponse) {
          q = _q;
          messageObj = _messageObj;
          handleResponse = _handleResponse;

          q.jwt.handlers.getRestJWT.and.returnValue('');

          done();
        });
      });

      it('should call microservice client #send 2 times with correct arguments', function () {
        var destinations = ['sms_service', 'log_service'];

        q.microServiceRouter(messageObj, handleResponse);

        destinations.forEach(function (destination) {

          /*jshint camelcase: false */
          var microService = q.u_services.byDestination[destination];
          /*jshint camelcase: true */

          expect(microService.client.send).toHaveBeenCalledWith({
            application: microService.application,
            type: 'restRequest',
            path: '/api/users',
            pathTemplate: '/path/template',
            method: 'POST',
            headers: {
              'x-foo': 'bar'
            },
            params: {
              type: 'foo'
            },
            query: {
              bar: 'baz'
            },
            body: {
              login: 'johndoe',
              password: 'secret'
            },
            ip: '127.0.0.1',
            ips: ['client'],
            token: 'updated-jwt-token',
            args: {},
            jwt: true
          }, jasmine.any(Function));
        });
      });
    },

    shouldCallHandleResponse: function () {
      var destinations = ['sms_service', 'log_service'];

      beforeEach(function (done) {
        boot(function (_q, _messageObj, _handleResponse) {
          q = _q;
          messageObj = _messageObj;
          handleResponse = _handleResponse;

          q.jwt.handlers.getRestJWT.and.returnValue('');

          done();
        });
      });

      it('should call handleResponse', function () {

        /*jshint camelcase: false */
        var expected = {
          type: 'hello',
          message: {
            destinations: {
              sms_service: {
                message: {
                  application: 'sms-micro-service'
                }
              },
              log_service: {
                message: {
                  application: 'log-micro-service',
                  token: 'updated-jwt-token'
                }
              }
            },
            token: 'updated-jwt-token'
          }
        };
        /*jshint camelcase: true */

        destinations.forEach(function (destination) {

          /*jshint camelcase: false */
          var microService = q.u_services.byDestination[destination];
          /*jshint camelcase: true */

          microService.client.send.and.callFake(function (message, cb) {
            var responseObj = {
              message: {
                application: message.application,
                token: message.token
              },
              finished: true
            };
            cb(responseObj);
          });
        });

        q.microServiceRouter(messageObj, handleResponse);

        expect(handleResponse).toHaveBeenCalledWith(expected);
      });
    },

    shouldCallRouteOnResponse: function (route) {
      var destinations = ['sms_service', 'log_service'];

      /*jshint camelcase: false */
      var expectedObj = {
        type: 'hello',
        message: {
          destinations: {
            sms_service: {
              message: {
                application: 'sms-micro-service'
              }
            },
            log_service: {
              message: {
                application: 'log-micro-service',
                token: 'updated-jwt-token'
              }
            }
          },
          token: 'updated-jwt-token'
        }
      };
      /*jshint camelcase: true */

      beforeEach(function (done) {
        boot(function (_q, _messageObj, _handleResponse) {
          q = _q;
          messageObj = _messageObj;
          handleResponse = _handleResponse;

          q.jwt.handlers.getRestJWT.and.returnValue('');

          destinations.forEach(function (destination) {

            /*jshint camelcase: false */
            var microService = q.u_services.byDestination[destination];
            /*jshint camelcase: true */

            microService.client.send.and.callFake(function (message, cb) {
              var responseObj = {
                message: {
                  application: message.application,
                  token: message.token
                },
                finished: true
              };
              cb(responseObj);
            });
          });

          done();
        });
      });

      describe('And onResponse defined', function () {
        var onResponse;

        beforeEach(function () {
          onResponse = jasmine.createSpy();

          q.router.hasRoute.and.returnValue({
            matched: route.matched,
            args: route.args,
            destination: route.destination,
            pathTemplate: route.pathTemplate,
            onResponse: onResponse
          });
        });

        it('should call route.onResponse with correct arguments', function () {
          q.microServiceRouter(messageObj, handleResponse);

          var args = onResponse.calls.argsFor(0)[0];
          expect(args.message).toBe(messageObj);
          expect(args.destination).toBe('logout_service');
          expect(args.responseObj).toEqual(expectedObj);
          expect(args.handleResponse).toBe(handleResponse);
          expect(args.send).toEqual(jasmine.any(Function));
        });

        describe('and not handled', function () {
          it('should call handleResponse with response object', function () {
            q.microServiceRouter(messageObj, handleResponse);

            expect(handleResponse).toHaveBeenCalledWith(expectedObj);
          });
        });

        describe('and not handled', function () {
          it('should not call handleResponse', function () {
            onResponse.and.returnValue(true);

            q.microServiceRouter(messageObj, handleResponse);

            expect(handleResponse).not.toHaveBeenCalled();
          });
        });
      });
    }
  };
};
