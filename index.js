<<<<<<< HEAD
const scr = require('./test');
/*const DialogflowApp = require('actions-on-google').DialogflowApp
const express = require('express');
let app = express();

app.post('/', function (request, response) {
  const  assistant = new DialogflowApp({request: request, response: response});
  //request.body
});
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
  rsp.json({ fulfillmentText: "Hi Patricia" });
  //rsp.json({ fulfillmentText: "hi" });
};
=======
const express = require('express');
const bodyParser = require('body-parser');
const scrape = require("./scrape");

const app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

// http://localhost:5000/process-intent
app.post("/process-intent", (req, res) => {
  console.log("Hey, it worked!");
  let queryResult = req.body.queryResult;
  let action = queryResult.action;
  switch(action){
      case "send_take_major": 
          scrape.getCourseForMajor(queryResult.parameters.major, (papers) =>
          {
            let str = "";
            console.log(papers);
            for(let i = 0; i < papers.length; i++)
            {
                str += papers[i].code + ", ";
            }
            return res.json({fulfillmentText: "A suggested set of papers for "+queryResult.parameters.major+" would be: "+str});
          });
          break;

       case "ask_about_jobs":
            console.log("Test");
            scrape.getSuitableJobs(queryResult.parameters.major, (theJobs) =>
        {

            return res.json({fulfillmentText: "If you took "+queryResult.parameters.major+" you could become: "+theJobs});
        });  
        break;

      default:
          console.log("Action not matched");
  }

});

app.get("/", (req, res) =>
{
    console.log("Get request success!");
    res.sendFile(__dirname + "/Index.html");
});

app.listen((process.env.PORT || 8000), () => {
  console.log("Server is up and running...");
});
>>>>>>> e9bb0891368f6f42bbaa4715df90983061198f77
