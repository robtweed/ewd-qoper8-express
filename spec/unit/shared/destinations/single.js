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

        expect(q.jwt.handlers.updateJWTExpiry.calls.count()).toBe(1);
        expect(q.jwt.handlers.updateJWTExpiry).toHaveBeenCalledWith('token1', 'login-micro-service');
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
        q.jwt.handlers.isJWTValid.and.returnValue({
          ok: false,
          error: 'JWT token is invalid'
        });

        q.microServiceRouter(messageObj, handleResponse);

        expect(handleResponse).toHaveBeenCalledWith({
          message: {
            error: 'JWT token is invalid'
          }
        });
      });

      it('should call updateJWTExpiry 2 times with with correct arguments', function () {
        q.jwt.handlers.isJWTValid.and.returnValue({
          ok: true
        });

        q.microServiceRouter(messageObj, handleResponse);

        expect(q.jwt.handlers.updateJWTExpiry).toHaveBeenCalledWith('jwt-token', 'login-micro-service');
      });
    },

    shouldCallMicroServiceClientSendMethod: function () {
      var destination = 'login_service';

      beforeEach(function (done) {
        boot(function (_q, _messageObj, _handleResponse) {
          q = _q;
          messageObj = _messageObj;
          handleResponse = _handleResponse;

          q.jwt.handlers.getRestJWT.and.returnValue('');

          done();
        });
      });

      it('should call microservice client #send with correct arguments', function () {

        /*jshint camelcase: false */
        var microService = q.u_services.byDestination[destination];
        /*jshint camelcase: true */

        q.microServiceRouter(messageObj, handleResponse);

        expect(microService.client.send).toHaveBeenCalledWith({
          application: 'login-micro-service',
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
    },

    shouldCallHandleResponse: function () {
      var destination = 'login_service';

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
        var responseObj = {};

        /*jshint camelcase: false */
        var microService = q.u_services.byDestination[destination];
        /*jshint camelcase: true */

        microService.client.send.and.callFake(function (message, cb) {
          cb(responseObj);
        });

        q.microServiceRouter(messageObj, handleResponse);

        expect(handleResponse).toHaveBeenCalledWith(responseObj);
      });
    },

    shouldCallRouteOnResponse: function (route) {
      var destination = 'login_service';
      var responseObj = {};

      beforeEach(function (done) {
        boot(function (_q, _messageObj, _handleResponse) {
          q = _q;
          messageObj = _messageObj;
          handleResponse = _handleResponse;

          q.jwt.handlers.getRestJWT.and.returnValue('');

          /*jshint camelcase: false */
          var microService = q.u_services.byDestination[destination];
          /*jshint camelcase: false */

          microService.client.send.and.callFake(function (message, cb) {
            cb(responseObj);
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
          expect(args.destination).toBe('login_service');
          expect(args.responseObj).toBe(responseObj);
          expect(args.handleResponse).toBe(handleResponse);
          expect(args.send).toEqual(jasmine.any(Function));
        });

        describe('and not handled', function () {
          it('should call handleResponse with response object', function () {
            q.microServiceRouter(messageObj, handleResponse);

            expect(handleResponse).toHaveBeenCalledWith(responseObj);
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

