'use strict';

module.exports = function (title, boot, config) {
  var decorators = config.decorators || {};

  describe(title, function () {
    var qx;
    var q;
    var res;
    var req;
    var next;
    var timeout;
    var resultObj;
    var expectedObj;

    beforeEach(function (done) {
      boot(function (_qx, _q, _req, _res, _next, _timeout) {
        qx = _qx;
        q = _q;
        req = _req;
        res = _res;
        next = _next;
        timeout = _timeout;

        resultObj = config.getResultObj();
        expectedObj = config.getExpectedObj();

        done();
      });
    });

    if (config.nextCallback) {
      describe('When next callback passed', function () {
        it('should call next', function () {
          qx.handleMessage(req, res, next);
          jasmine.clock().tick(timeout);

          var handleResponse = q.handleMessage.calls.argsFor(0)[1];
          handleResponse(resultObj);

          expect(res.locals.message).toEqual(expectedObj);
          expect(next).toHaveBeenCalled();
        });
      });
    }

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
        expect(res.send).toHaveBeenCalledWith(expectedObj);
      });

      if (decorators.statusCode) {
        describe('custom status code', function () {
          var statusCode;

          beforeEach(function () {
            statusCode = config.decorators.statusCode(resultObj);
          });

          it('should send custom status code', function () {
            qx.handleMessage(req, res);
            jasmine.clock().tick(timeout);

            var handleResponse = q.handleMessage.calls.argsFor(0)[1];
            handleResponse(resultObj);

            expect(res.status).toHaveBeenCalledWith(statusCode);
          });
        });
      }

      if (decorators.response) {
        describe('custom error response', function () {
          var response;

          beforeEach(function () {
            response = config.decorators.response(resultObj);
          });

          it('should send custom error response', function () {
            qx.handleMessage(req, res);
            jasmine.clock().tick(timeout);

            var handleResponse = q.handleMessage.calls.argsFor(0)[1];
            handleResponse(resultObj);

            expect(res.send).toHaveBeenCalledWith(response);
          });
        });
      }
    });
  });
};
