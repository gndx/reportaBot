'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

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
            receiveMessage(messagingEvent)
          }
        } else if (messagingEvent.postback) {
          receiveMessageWelcome(messagingEvent)
        }
      });
    });
    res.sendStatus(200);
  }
});

const receiveMessageWelcome = (event) => {
  const recipientId = event.sender.id;
  sendMessangeWelcome(recipientId);
};

const sendMessangeWelcome = async (recipientId) => {
  const messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: '¡Hola! soy ReportaBot...\n Estoy para ayudarte 😎'
    }
  };
  await sendToMessenger(messageData);
  await sendMsgInstructions(recipientId);
};

const sendMsgInstructions = (recipientId) => {
  const msgWelcome = [
    "¿Quieres Reportar una Incidencia en tu ciudad?",
    "¿Quieres Reportar una Incidencia en Guadalajara?",
    "¿Quieres Reportar una Incidencia en Monterrey?",
    "¿Quieres Reportar una Incidencia en CDMX?",
  ];
  const instructions = msgWelcome[Math.floor(Math.random() * msgWelcome.length)];
  const reply = {
    "recipient": {
      "id": recipientId
    },
    "message": {
      "text": instructions,
      "quick_replies": [{
          "content_type": "text",
          "title": "Enviar Reporte",
          "payload": "send_report",
        },
        {
          "content_type": "text",
          "title": "Información",
          "payload": "only_info"
        }
      ]
    }
  }
  sendToMessenger(reply);
};

const sendInformation = (recipientId) => {
  const reply = {
    recipient: {
      id: recipientId
    },
    message: {
      text: '¡Hola! soy ReportaBot...\nUn servicio creado por Chewiekie INC, para crear un sistema de reportes en tu escuela, comunidad o tu ciudad. \n \nSoy 100% libre y personalizable. \n \n 😎'
    }
  };
  sendToMessenger(reply);
  setTimeout(sendMsgInstructions, 3000, recipientId);
};

const receiveMessage = (event) => {
  const recipientId = event.sender.id;
  const messageText = event.message.text;
  const quick_reply = event.message.quick_reply
  switch (event.message.text) {
    case 'Enviar Reporte':
      console.log('Enviar Reporte')
      break;
    case 'Información':
      sendInformation(recipientId);
      break;
    default:
      sendMsgInstructions(recipientId);
      break;
  };
};

const sendToMessenger = (messageData) => {
  request({
      uri: 'https://graph.facebook.com/v2.6/me/messages',
      qs: { access_token: env.TOKEN },
      method: 'POST',
      json: messageData
  }, (error, response, data) => {
      if (error) {
          console.log('No es posible enviar el mensaje');
      } else {
          console.log("recurso enviado...");
      }
  });
}

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