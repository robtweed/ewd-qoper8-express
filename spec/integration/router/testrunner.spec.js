'use strict';

var request = require('supertest')('http://localhost:8080');
var utils = require('../utils');

describe(' - integration/ewd-qoper8-express/router:', function () {
  var cp;
  var verbs = ['GET', 'POST', 'PUT', 'DELETE'];

  beforeAll(function (done) {
    cp = utils.fork(require.resolve('./express'), done);
  });

  afterAll(function (done) {
    utils.exit(cp, done);
  });

  verbs.forEach(function (verb) {
    it('should handle ' + verb, function (done) {
      request[verb.toLowerCase()]('/qoper8/testing/a/b?hello=world').
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

    it('should handle ' + verb + ' with application', function (done) {
      request[verb.toLowerCase()]('/qoper8-application/testing').
        expect(200).
        expect(function (res) {
          var body = res.body;

          expect(body.youSent.application).toBe('jwt');
        }).
        end(function (err) {
          return err ? done.fail(err) : done();
        });
    });

    it('should handle ' + verb + ' with expressType', function (done) {
      request[verb.toLowerCase()]('/qoper8-expressType/testing').
        expect(200).
        expect(function (res) {
          var body = res.body;

          expect(body.youSent.expressType).toBe('4.x');

          done();
        }).
        end(function (err) {
          return err ? done.fail(err) : done();
        });
    });

    it('should handle ' + verb + ' with nextCallback', function (done) {
      request[verb.toLowerCase()]('/qoper8-nextCallback/testing').
        expect(200).
        expect(function (res) {
          var body = res.body;

          expect(body.youSent.application).toBe('qoper8-nextCallback');
        }).
        end(function (err) {
          return err ? done.fail(err) : done();
        });
    });
  });
});
