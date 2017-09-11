'use strict';

module.exports = {
  mock: function () {
    var res = {
      locals: {},
      send: jasmine.createSpy(),
      set: jasmine.createSpy(),
      status: jasmine.createSpy()
    };

    res.status.and.returnValue(res);

    return res;
  }
};
