const express = require('express');
const bodyParser = require('body-parser');

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
