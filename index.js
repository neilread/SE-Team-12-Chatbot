const scr = require('./test');

exports.helloHttp = function helloHttp (request, response) {
  response.json({ fulfillmentText: scr.Test.t(request.fulfillmentText.) });
};
