'use strict';



module.exports = function (boot, route, type) {
  var destinationsSpec = require('./destinations')(boot, type);

  describe('And ' + type + ' destination', function () {
    var q;
    var messageObj;
    var handleResponse;

    beforeEach(function (done) {
      boot(function (_q, _messageObj, _handleResponse) {
        q = _q;
        messageObj = _messageObj;
        handleResponse = _handleResponse;

        q.router.hasRoute.and.returnValue(route);
        q.jwt.handlers.updateJWTExpiry.and.returnValue('updated-jwt-token');

        done();
      });
    });

    it('should call getRestJWT with correct arguments', function () {
      q.microServiceRouter(messageObj, handleResponse);

      expect(q.jwt.handlers.getRestJWT).toHaveBeenCalledWith(messageObj);
    });

    describe('And getRestJWT returns no token', function () {
      beforeEach(function () {
        q.jwt.handlers.getRestJWT.and.returnValue('');
      });

      destinationsSpec.whenNoTokenIsReturned();
    });

    describe('And getRestJWT returns token', function () {
      beforeEach(function () {
        q.jwt.handlers.getRestJWT.and.returnValue('jwt-token');
      });

      it('should call isJWTValid with correct arguments', function () {
        q.jwt.handlers.isJWTValid.and.returnValue({
          ok: true
        });

        q.microServiceRouter(messageObj, handleResponse);

        expect(q.jwt.handlers.isJWTValid).toHaveBeenCalledWith('jwt-token');
      });

      destinationsSpec.whenNoTokenIsNotReturned();
    });

    destinationsSpec.shouldCallMicroServiceClientSendMethod();
    destinationsSpec.shouldCallHandleResponse();
    destinationsSpec.shouldCallRouteOnResponse(route);
  });
};
