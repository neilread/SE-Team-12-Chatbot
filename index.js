//const functions = require('firebase-functions');
const scr = require('./test');

const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');

const server = express();
server.use(bodyParser.urlencoded({
    extended: true
}));

server.use(bodyParser.json());

server.post('/process-intent', (req, res) => {
  console.log("Hey, it worked!");
  res.json({fulfillmentText: req.body.queryResult.queryText});
  /*return res.json({
    speech: 'Something went right!',
    displayText: 'Something went right!',
    source: 'get-movie-details'
  });*/
});

server.listen((process.env.PORT || 8000), () => {
  console.log("Server is up and running...");
});
//const API_KEY = require('./apiKey');


/*const express = require('express');
const bodyParser = require('body-parser');

const restService = express();

restService.use(bodyParser.urlEncoded({
  extended: true
}));

restService.use(bodyParser.json());

restService.post('/echo', function(req, res) {
  
});*/

/*exports.webhook = (req, rsp) =>
{
  let s = JSON.stringify(req);
  rsp.json({ fulfillmentText: "Hello" });
  //rsp.json({ fulfillmentText: "hi" });
};*/
