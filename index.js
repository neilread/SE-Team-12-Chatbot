const scr = require('./test');
const DialogflowApp = require('actions-on-google').DialogflowApp
const express = require('express');
let app = express();

app.post('/', function (request, response) {
  const  assistant = new DialogflowApp({request: request, response: response});
  //request.body
})
/*const express = require('express');
const bodyParser = require('body-parser');

const restService = express();

/*restService.use(bodyParser.urlEncoded({
  extended: true
}));

restService.use(bodyParser.json());

restService.post('/echo', function(req, res) {
  
});*/

exports.webhook = (req, rsp) =>
{
  rsp.json({ fulfillmentText: req.queryId });
  //rsp.json({ fulfillmentText: "hi" });
};
