'use strict';

module.exports = {
  mock: function () {
    return {
      getRestJWT: jasmine.createSpy(),
      updateJWTExpiry: jasmine.createSpy(),
      isJWTValid: jasmine.createSpy()
    };
  }
};
