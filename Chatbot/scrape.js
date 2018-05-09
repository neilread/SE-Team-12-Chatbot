var request = require('request');
var cheerio = require('cheerio');

request('http://www.google.com/', function(err, resp, html) {
        if (!err){
          const $ = cheerio.load(html);
          //console.log(html); 
      }
});
const puppeteer = require("puppeteer");
const undergradProgrammes = "https://www.aut.ac.nz/study/study-options";

class Paper
{
    constructor(code, name, year, points)
    {
        this.code = code;
        this.name = name;
        this.year = year;
        this.points = points;
    }

    static textToPaper(text, year)
    {
        let words = text.split(" ");

        let i = 1;
        let pName = "";
    
        // To do: error trap for infinite loop
        while(!words[i].startsWith("("))
        {
            pName += words[i++] + " ";
        }
    
        let paper =
        {
            code : words[0],
            name : pName,
            year : year.text().split(" ")[1],
            points : words[i].substr(1)
        }
    
        return paper;
    }
}

function textToPaper(text, year)
{
    let words = h.text().split(" ");
    pName = "";
    for(var i = 1; i < words.length - 2; i++)
    {
        pName += words[i];
    }
    return new Paper(words[0], pName, year.text().split(" ")[1], words[words.length - 3]);
}

async function launchPage(url)
{
    const b = await puppeteer.launch();
    const p = await b.newPage();
    await p.goto(url);
    return { browser : b, page : p};
}

async function getPageByElement(url)
{
    getPageByElement(launchPage(url));
}

async function getPageByElementText(webpage, selector, text)
{
    var result = null;
    let headings = await getElementsBySelector(webpage, selector);
    var p = null;

    await headings.forEach(h =>
    {
        if(h.text === text)
        {
            p = h.link;
        }
    });

    if(p != null)
    {
        result = await launchPage(p);
    }

    return result;
}

async function getElementsBySelector(webpage, selector)
{
    const result = await webpage.page.evaluate((selector) =>
    {
        let elements = Array.from(document.querySelectorAll(selector));
        let links = elements.map(element => 
        {
            return { "link" : element.href, "text" : element.textContent };
        });
        return links;
    }, selector);
    return result;
}

async function accessProgramme(prog)
{
    const webpage = await launchPage(undergradProgrammes);
    return await getPageByElementText(webpage, "div.col-sm-6 ul li a", prog);
}

async function accessDegree(degree, prog, webpage)
{
    if(webpage == null)
    {
        // To do, error check if prog is null
        webpage = await accessProgramme(prog);
    }

    return await getPageByElementText(webpage, "li a", degree);
}

async function accessMajor(major, degree, prog, webpage)
{
    if(webpage == null)
    {
        // To do, error check if prog is null
        webpage = await accessDegree(degree, prog, null);
    }

    return await getPageByElementText(webpage, "li a", major);
}

function textToPaper(text, year)
{
    let words = text.split(" ");

    let i = 1;
    let pName = "";

    // To do: error trap for infinite loop
    while(!words[i].startsWith("("))
    {
        pName += words[i++] + " ";
    }

    paper =
    {
        code : words[0],
        name : pName,
        year : year.text().split(" ")[1],
        points : words[i].substr(1)
    }

    return paper;
}

async function getPapersForMajor(major, degree, prog, webpage)
{
    if(webpage == null)
    {
        webpage = await accessMajor(major, degree, prog, webpage);
    }

    await webpage.page.addScriptTag({ content: `${Paper}`});
    
    return await webpage.page.evaluate(function()
    {
        let papers = new Array();
        $.each($("h2:contains('Year')"), (index, y) =>
        {
            $.each($(y).nextAll("h3:contains('Complete the following papers')").first().nextAll("ul").first().children("li"), (index, p) =>
            {
                papers.push(Paper.textToPaper($(p).text(), $(y)));
            });

            let optionalPaper = $(y).nextAll("h3:contains('choose one of')").first().nextAll("ul").children("li").first();
            papers.push(Paper.textToPaper($(optionalPaper).text(), $(y)));
        });
        
        return papers;
    });
}

getPapersForMajor("Software Development", "Bachelor of Computer and Information Sciences", "Engineering, computer and mathematical sciences", null).then((value)=>
{
    if(value != null)
    {
        //value.page.screenshot({path: 'test.png'});
        //console.log(value);
        //console.log(typeof(value));
        //console.log(value[0]);
    }
    else
    {
        console.log("Oh no!");
    }
    console.log("done");

    return value;
});