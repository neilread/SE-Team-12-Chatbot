const scr = require('./test');
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
