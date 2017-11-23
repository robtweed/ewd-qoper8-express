'use strict';

var request = require('supertest')('http://localhost:8080');
var utils = require('../utils');

describe('integration/ewd-qoper8-express/express-message:', function () {
  var cp;

  beforeAll(function (done) {
    cp = utils.fork(require.resolve('./server'), done);
  });

  afterAll(function (done) {
    utils.exit(cp, done);
  });

  it('should handle express message', function (done) {
    request.
      post('/qoper8').
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

  it('should handle non-express message', function (done) {
    request.
      get('/qoper8/test').
      expect(200).
      expect(function (res) {
        var body = res.body;

        expect(body.messageType).toBe('non-express');
        expect(body.workerSent).toMatch(/^hello from worker \d{4,5}$/);
        expect(body.time).toMatch(/(\w{3}) (\w{3}) (\d{2}) (\d{4}) ((\d{2}):(\d{2}):(\d{2})) GMT\+\d{4}/);
      }).
      end(function (err) {
        return err ? done.fail(err) : done();
      });
  });

  it('should handle unhandled message', function (done) {
    request.
      get('/qoper8/fail').
      expect(400).
      expect(function (res) {
        var body = res.body;

        expect(body).toEqual({
          error: 'No handler found for unhandled-message message'
        });
      }).
      end(function (err) {
        return err ? done.fail(err) : done();
      });
  });
});
