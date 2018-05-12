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
        let words = text.split(" ");

        let i = 1;
        let pName = "";
    
        // To do: error trap for infinite loop
        while(!words[i].startsWith("("))
        {
            pName += words[i++] + " ";
        }
    
        return new Paper(words[0], pName.trim(), year.text().split(" ")[1], words[i].substr(1));
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

function test(arg)
{
    return "Hello" + arg;
}

getPapersForMajor("Software Development", "Bachelor of Computer and Information Sciences", "Engineering, computer and mathematical sciences", null).then((value)=>
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
});

//findDegree("Software Development");
