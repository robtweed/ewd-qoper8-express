'use strict';

var request = require('supertest')('http://localhost:8080');
var utils = require('../utils');

describe('integration/ewd-qoper8-express/sending-error-responses:', function () {
  var cp;

  beforeAll(function (done) {
    cp = utils.fork(require.resolve('./server'), done);
  });

  afterAll(function (done) {
    utils.exit(cp, done);
  });

  it('should be passed', function (done) {
    request.
      get('/qoper8/pass').
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

  it('should be failed', function (done) {
    request.
      get('/qoper8/fail').
      expect(403).
      expect(function (res) {
        var body = res.body;

        expect(body).toEqual({
          error: 'An error occurred!'
        });
      }).
      end(function (err) {
        return err ? done.fail(err) : done();
      });
  });

  it('should have no handler', function (done) {
    request.
      get('/qoper8/nohandler').
      expect(400).
      expect(function (res) {
        var body = res.body;

        expect(body).toEqual({
          error: 'No handler found for ewd-qoper8-express message'
        });
      }).
      end(function (err) {
        return err ? done.fail(err) : done();
      });
  });

  it('should have no handler and pass error via next callback', function (done) {
    request.
      get('/qoper8/nohandler-nextCallback').
      expect(400).
      expect(function (res) {
        var body = res.body;

        expect(body).toEqual({
          error: 'No handler found for ewd-qoper8-express message'
        });
      }).
      end(function (err) {
        return err ? done.fail(err) : done();
      });
  });
});
