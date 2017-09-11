'use strict';

var request = require('supertest')('http://localhost:8080');
var utils = require('../utils');

describe(' - integration/ewd-qoper8-express/processing-interception:', function () {
  var cp;

  beforeAll(function (done) {
    cp = utils.fork(require.resolve('./express'), done);
  });

  afterAll(function (done) {
    utils.exit(cp, done);
  });

  it('should intercept processing', function (done) {
    request.
      get('/qoper8/users?ewd=testing').
      expect(200).
      expect(function (res) {
        var body = res.body;

        expect(body.data).toEqual(['John Doe', 'Jane Doe']);

      }).
      end(function (err) {
        return err ? done.fail(err) : done();
      });
  });

  it('should not intercept processing', function (done) {
    request.
      get('/qoper8/users?ewd=staging').
      expect(200).
      expect(function (res) {
        var body = res.body;
        expect(body.youSent).toEqual(jasmine.any(Object));
        expect(body.workerSent).toMatch(/^hello from worker \d{4,5}$/);
        expect(body.time).toMatch(/(\w{3}) (\w{3}) (\d{2}) (\d{4}) ((\d{2}):(\d{2}):(\d{2})) GMT\+\d{4}/);

      }).
      end(function (err) {
        return err ? done.fail(err) : done();
      });
  });
});
