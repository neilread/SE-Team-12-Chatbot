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
          scrape.getPapersForMajor(queryResult.parameters.major, (papers) =>
          {
            let str = "";
            console.log(papers);
            for(let i = 0; i < papers.length; i++)
            {
                str += papers[i].code + ", ";
            }
            return res.json({fulfillmentText: str});
          });
          break;
      default:
          console.log("Action not matched");
  }

  /*scrape.getPapersForMajor("Software Development",
     "https://www.aut.ac.nz/study/study-options/engineering-computer-and-mathematical-sciences/courses/bachelor-of-computer-and-information-sciences/software-development-major",
      (papers) =>
  {
    let str = "";
    console.log(papers);
    for(let i = 0; i < papers.length; i++)
    {
        str += papers[i].code + ", ";
    }
    return res.json({fulfillmentText: str});
  });*/
});

app.get("/", (req, res) =>
{
    console.log("Get request success!");
    res.sendFile(__dirname + "/Index.html");
});

//app.set('port', (process.env.PORT || 5000));

app.listen((process.env.PORT || 8000), () => {
  console.log("Server is up and running...");
});
