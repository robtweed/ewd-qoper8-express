'use strict';

var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var qoper8 = require('ewd-qoper8');
var qx = require('../../../');

var app = express();
app.use(bodyParser.json());

var q = new qoper8.masterProcess();
qx.addTo(q);

app.post('/qoper8', function (req, res) {
  qx.handleMessage(req, res);
});

app.get('/qoper8/test', function (req, res) {
  var request = {
    type: 'non-express-message',
    hello: 'world'
  };
  q.handleMessage(request, function (response) {
    res.send(response);
  });
});

app.get('/qoper8/fail', function (req, res) {
  var request = {
    type: 'unhandled-message',
  };
  q.handleMessage(request, function (response) {
    var message = response.message;
    if (message.error) {
      res.status(400).send(message);
    } else {
      res.send(message);
    }
  });
});

q.on('start', function () {
  this.worker.module = path.join(__dirname, 'express-module');
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

