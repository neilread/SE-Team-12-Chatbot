/* A webhook that links scrape.js to the front end software dialog flow*/

const express = require('express');
const bodyParser = require('body-parser');
const scrape = require("./scrape");

const server = express();
server.use(bodyParser.urlencoded({
    extended: true
}));

server.use(bodyParser.json());

// http://localhost:8000/process-intent
server.post("/process-intent", (req, res) => 
{
  scrape.getPapersForMajor("Software Development", null, (papers) =>
  {
    let str = "";
    for(let i = 0; i < papers.length; i++)
    {
        str += papers[i].code + ", ";
    }
    return res.json({fulfillmentText: str});
  });
});

server.get("/", (req, res) =>
{
    res.sendFile("index.html", {"root":"html"});
    console.log("Get request success!");
});

server.listen((process.env.PORT || 8000), () => {
  console.log("Server is up and running...");
});
