'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json())

app.get('/', function (req, res) {
  res.send('Hello World!')
})

const allowCrossDomain = function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if ('OPTIONS' === req.method) {
    res.sendStatus(200);
  } else {
    next();
  }
};
app.use(allowCrossDomain);

app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});