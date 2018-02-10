'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.send('Hello World!')
});

app.get('/webhook', function (req, res) {
  if (req.query['hub.verify_token'] === 'reportaBot_says_hello') {
      res.send(req.query['hub.challenge']);
  } else {
      res.send('reportaBot_says_bye');
  }
});

app.post('/webhook', function (req, res) {
  const data = req.body;
  if (data.object == 'page') {
    data.entry.forEach(function (pageEntry) {
      pageEntry.messaging.forEach(function (messagingEvent) {
        if (messagingEvent.message) {
          if (messagingEvent.message.attachments) {
            console.log(messagingEvent)
          } else {
            console.log(messagingEvent)
          }
        } else if (messagingEvent.postback) {
          console.log(messagingEvent)
        }
      });
    });
    res.sendStatus(200);
  }
});

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