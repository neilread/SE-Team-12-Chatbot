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
            return res.json({fulfillmentText: "I'm sorry, but I didn't understand what you said."});
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
