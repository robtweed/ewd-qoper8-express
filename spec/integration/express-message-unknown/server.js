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

app.get('/qoper8/test', function (req, res) {
  var request = {
    type: 'ewd-qoper8-express',
    path: req.originalUrl
  };

  q.handleMessage(request, function (response) {
    utils.handleResponse(res, response);
  });
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

