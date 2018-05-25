const express = require('express');
const bodyParser = require('body-parser');
const scrape = require("./scrape");

const app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());


// http://localhost:5000/process-intent
app.post('/process-intent', (req, res) => {
  console.log("Hey, it worked!");
  scrape.getPapersForMajor("Software Development",
   "Bachelor of Computer and Information Sciences",
    "Engineering, computer and mathematical sciences",
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
  });
  //res.json({fulfillmentText: req.body.queryResult.queryText});
  /*return res.json({
    speech: 'Something went right!',
    displayText: 'Something went right!',
    source: 'get-movie-details'
  });*/
});

app.get("/", (req, res) =>
{
    //res.send("Hello World!");
    console.log("Get request success!");
    res.sendFile(__dirname + "/index.html");
});

app.set('port', (process.env.PORT || 5000));

app.listen((app.get('port')), () => {
  console.log("Server is up and running...");
});
