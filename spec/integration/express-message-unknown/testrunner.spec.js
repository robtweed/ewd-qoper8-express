'use strict';

var request = require('supertest')('http://localhost:8080');
var utils = require('../utils');

describe('integration/ewd-qoper8-express/express-message-unknown:', function () {
  var cp;

  beforeAll(function (done) {
    cp = utils.fork(require.resolve('./server'), done);
  });

  afterAll(function (done) {
    utils.exit(cp, done);
  });

  it('should handle unhandled express message', function (done) {
    request.
      get('/qoper8/test').
      expect(400).
      expect(function (res) {
        var body = res.body;

        expect(body).toEqual({
          error: 'No handler found for /qoper8/test request'
        });
      }).
      end(function (err) {
        return err ? done.fail(err) : done();
      });
  });
});
