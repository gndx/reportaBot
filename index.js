'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const admin = require("firebase-admin");
const moment = require('moment');

const app = express();
app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());

const env = {
  TOKEN: "EAAHmpU2nlHQBAAXYXlRzYkIw3nUTC9DirH97fiAQ0SRi4fUfl5HkKT1uIXO10FcBX94vy5TikRGeVgAkZCFVqkGQMddDe3wTsZA0PaF8EW0Fx0bndC8SXD6SlB6CtsBfnnwY9Vr2jfiFrG1sdQwi4Xu4hjwV8MrxJLBRNyuAZDZD"
}

const globalMessages = {
  reportInfo: 'Gracias por preocuparte por tu ciudad para iniciar su reporte es necesario que nos proporciones el tipo de incidencia:',
  defaultMsg: 'Recuerda soy un Bot y por el momento solo puedo crear Reportes 🤓'
}

const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://reportabot-gdl.firebaseio.com"
});

const db = admin.database();
const ref = db.ref("data");

const saveDataFirebase = (data) => {
  const { numReport } = data;
  let usersRef = ref.child(numReport);
  usersRef.set(data);
}

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
            console.log('attachment')
            reciveAttachments(messagingEvent);
          } else {
            console.log('mensaje normal')
            receiveMessage(messagingEvent);
          }
        } else if (messagingEvent.postback) {
          console.log('postback')
          receiveMessageWelcome(messagingEvent)
        }
      });
    });
    res.sendStatus(200);
  }
});

const receiveMessageWelcome = (event) => {
  const recipientId = event.sender.id;
  const postBackType = event.postback.payload;
  const postBackTitle = event.postback.title;
  switch (postBackType) {
    case 'GET_STARTED_REPORTABOT':
      sendMessangeWelcome(recipientId);
      console.log(postBackTitle)
      break;
    case 'REPORT_ANIMAL': 
    case 'REPORT_BUMP':
    case 'REPORT_LUMINARY':
    setTimeout(userLocation, 1000, recipientId)
    default:
      break;
  }

};

const sendMessangeWelcome = (recipientId) => {
  const messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: '¡Hola! soy ReportaBot...\n Estoy para ayudarte 😎'
    }
  };
  sendToMessenger(messageData);
  setTimeout(sendMsgInstructions, 1000, recipientId);
};

const sendMsgInstructions = (recipientId) => {
  const msgWelcome = [
    "¿Quieres reportar una incidencia en tu localidad?",
    "¿Quieres reportar una incidencia en la Ciudad?",
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

const reciveAttachments = (event) => {
  const recipientId = event.sender.id;
  const timeStamp = event.timestamp;
  const nowTimeStamp = new Date().getTime();
  console.log(nowTimeStamp);
  const messageAttachments = event.message.attachments;
  let lat = null;
  let long = null;
  if (messageAttachments[0].payload.coordinates) {
    lat = messageAttachments[0].payload.coordinates.lat;
    long = messageAttachments[0].payload.coordinates.long;
  }
  const data = {
    "userId": recipientId,
    "numReport": nowTimeStamp,
    "date": moment().format('MMMM Do YYYY, h:mm:ss a'),
    "type": 'luminary',
    "lat": lat, 
    "long": long
  };
  saveDataFirebase(data);
  const msgs = `¡Hey Gracias! \n\nHemos registrado tu reporte con numero de seguimineto: ${timeStamp}, \n\nGracias por usar ReportaBot 😍 \nUn asesor se pondra en contacto para darte seguimiento.`
  setTimeout(sendSimpleMsg, 1000, recipientId, msgs);
};

const receiveMessage = (event) => {
  const recipientId = event.sender.id;
  const messageText = event.message.text;
  const quick_reply = event.message.quick_reply

  switch (event.message.text) {
    case 'A':
    case 'Enviar Reporte':
      sendReport(recipientId)
      break;
    case 'Información':
      sendInformation(recipientId);
      break;
    default:
      sendCustomMsg(recipientId);
      break;
  };
};

const userLocation = (recipientId) => {
  const msgWelcome = [
    "¿Puedes proporcionarme la ubicacion del lugar a reportar?",
    "¿Cual es la ubicacion del lugar a reportar?",
  ];
  const instructions = msgWelcome[Math.floor(Math.random() * msgWelcome.length)];
  const reply = {
    "recipient": {
      "id": recipientId
    },
    "message": {
      "text": instructions,
      "quick_replies": [{
          "content_type": "location",
        },
      ]
    }
  }
  sendToMessenger(reply);
};

const sendCustomMsg = (recipientId) => {
  sendSimpleMsg(recipientId, globalMessages.defaultMsg);
  setTimeout(sendMsgInstructions, 2000, recipientId);
}

const sendReport = (recipientId) => {
  sendSimpleMsg(recipientId, globalMessages.reportInfo);
  setTimeout(typeOfReport, 3000, recipientId);
};

const typeOfReport = (recipientId) => {
  const reply = {
    "recipient": {
      "id": recipientId
    },
    "message": {
        "attachment": {
          "type": "template",
          "payload": {
          "template_type": "generic",
            "elements": [{
            "title": "Luminaria",
              "subtitle": "Si no funciona o es intermitente el servicio, al reportar enviareos un equipo para repararle. ",
              "image_url": "http://s3.amazonaws.com/chewiekie/img/luminaria_led.jpg",
              "buttons": [{
                "type": "postback",
                "title": "Reportar luminaria",
                "payload": "REPORT_LUMINARY",
              }],
            }, {
              "title": "Animal Muerto",
              "subtitle": "Sabemos la importancia de cuidar la salud, este tipo de reporte es atendido de urgencia.",
              "image_url": "http://s3.amazonaws.com/chewiekie/img/animal_muerto.jpg",
              "buttons": [{
                "type": "postback",
                "title": "Reportar Animal",
                "payload": "REPORT_ANIMAL",
              }],
            },
            {
              "title": "Bache",
              "subtitle": "El compromiso con la movilidad segura es nuestra prioridad, enviaremos un equipo a taparlo",
              "image_url": "http://s3.amazonaws.com/chewiekie/img/bache_ciudad.png",
              "buttons": [{
                "type": "postback",
                "title": "Reportar Bache",
                "payload": "REPORT_BUMP",
              }],
            }
          ]
          }
        }
    }
  }
sendToMessenger(reply);
};

const sendSimpleMsg = (recipientId, msg) => {
  console.log('mensaje')
  const messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: msg
    }
  };
  sendToMessenger(messageData);
}

const sendToMessenger = (messageData) => {
  request({
      uri: 'https://graph.facebook.com/v2.6/me/messages',
      qs: { access_token: env.TOKEN },
      method: 'POST',
      json: messageData
  }, (error, response, data) => {
      if (error) {
          console.log(error)
          console.log('No es posible enviar el mensaje');
      } else {
          console.log("recurso enviado...");
      }
  });
};

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