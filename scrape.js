const request = require("request");
const cheerio = require("cheerio");
const util = require("./util");
const puppeteer = require("puppeteer");

request('http://www.google.com/', function(err, resp, html) {
        if (!err){
          const $ = cheerio.load(html);
          //console.log(html); 
      }
});

const undergradProgrammes = "https://www.aut.ac.nz/study/study-options";

// Represents an AUT paper
class Paper
{
    constructor(code, name, year, points)
    {
        this.code = code;
        this.name = name;
        this.year = year;
        this.points = points;
    }

    /**
     * Converts a string to a paper with the passed year.
     * Text is in the format [code] [name] ([points] points)
     */
    static textToPaper(text, year)
    {
        util.checkIsType(text, "string", "text");
        util.checkIsInteger(year, "year");

        let words = text.trim().split(" ");
        let pName = "";

        for(let i = 1; i < words.length - 2; i++)
        {
            pName += words[i] + " ";
        }
    
        return new Paper(words[0], pName.trim(), year, parseInt(words[words.length - 2].substr(1)));
    }
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

async function getPapersForMajor(major, degree, prog, webpage)
{
    if(webpage == null)
    {
        webpage = await accessMajor(major, degree, prog, webpage);
    }
    
    // Retrieves all lines of text corresponding to a paper and their year
    let strings = await webpage.page.evaluate(() =>
    {
        let paperStrings = [];
        $.each($("h2:contains('Year')"), (index, y) =>
        {
            let year = parseInt($(y).text().split(" ")[1]);
            $.each($(y).nextAll("h3:contains('Complete the following papers')").first().nextAll("ul").first().children("li"), (index, p) =>
            {
                paperStrings.push(
                {
                    t: $(p).text(), 
                    y: year
                });
            });

            let optionalPaper = $(y).nextAll("h3:contains('choose one of')").first().nextAll("ul").children("li").first();
            paperStrings.push(
            {
                t: $(optionalPaper).text(), 
                y: year
            });
        });
        
        return paperStrings;
    });

    let papers = [];

    for(let i = 0; i < strings.length; i++)
    {
        papers[i] = Paper.textToPaper(strings[i].t, strings[i].y);
    }

    await webpage.page.close();

    return papers;
}

async function findDegree(degree)
{
    let webpage = await launchPage(undergradProgrammes);

    let s = await webpage.page.evaluate(() =>
    {
        let a = null;
        $.each($("div.col-sm-6 ul li a"), (i, p) =>
        {
            /*accessDegree(degree, p.text()).then(value =>
            {
                if(value != null)
                {
                    a = value;
                }
            });*/
        });
        return a;
    });

    s.page.screenshot("test.png");

    /*let programmes = await getElementsBySelector(webpage, "div.col-sm-6 ul li a");
    console.log(programmes);
    degreePages = [];
    
    await programmes.forEach(p =>
    {
        let page = launchPage(p.link).then(() =>
        {
            let degrees = getElementsBySelector(page, "");
        });
    });
    
    /*await webpage.page.evaluate(() =>
    {
        let degreePage = null;
        $.each($("div.col-sm-6 ul li"), (i, prog) =>
        {
            degreePage = await launchPage(prog.href);
        });
    });*/
}

/*getPapersForMajor("Software Development", "Bachelor of Computer and Information Sciences", "Engineering, computer and mathematical sciences", null).then((value)=>
{
    if(value != null)
    {
        //value.page.screenshot({path: 'test.png'});
        console.log(value);
        //console.log(typeof(value));
        //console.log(value[0]);
    }
    else
    {
        console.log("Oh no!");
    }
    console.log("done");

    return value;
});*/

function accessHTML(url, callback)
{
    request(url, function(error, response, html)
    {
        if(!error)
        {
            callback(cheerio.load(html))
        }
    }, callback);
}

var $ = accessHTML("https://scotch.io/tutorials/scraping-the-web-with-node-js", ($) =>
{
    console.log($("p").text());
});

module.exports =
{
    Paper,
    launchPage
}
