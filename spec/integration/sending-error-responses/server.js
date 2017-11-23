'use strict';

var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var qoper8 = require('ewd-qoper8');
var qx = require('../../../');
var utils = require('../utils');

var app = express();
app.use(bodyParser.json());

var q = new qoper8.masterProcess();
qx.addTo(q);

app.get('/qoper8/pass', function (req, res) {
  qx.handleMessage(req, res);
});

app.get('/qoper8/fail', function (req, res) {
  qx.handleMessage(req, res);
});

app.get('/qoper8/nohandler', function (req, res) {
  qx.handleMessage(req, res);
});

app.get('/qoper8/nohandler-nextCallback', function (req, res, next) {
  qx.handleMessage(req, res, next);
});

app.use(utils.errorHandler());

app.use(function (err, req, res, next) { // jshint ignore:line
  res.status(err.status || 500);
  res.status(err.status).send(err.response);
});

q.on('start', function () {
  this.worker.module = path.join(__dirname, 'worker-module');
  this.log = false;
});

q.on('started', function () {
  app.listen(8080, function () {
    process.send({
      type: 'express-started'
    });
  });
});

q.start();
