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

class PapersForYear
{
    constructor(year, compulsoryPapers, chooseOnePapers)
    {
        this.year = year;
        this.compulsoryPapers = compulsoryPapers;
        this.chooseOnePapers = chooseOnePapers;
    }
}

class Degree
{
    constructor(points, numYears, potentialPapers)
    {
        this.points = points;
        this.numYears = numYears;
        this.potentialPapers = potentialPapers;
    }

    static assignPapersToStudent(degree)
    {
        let pointsUsed = 0;
        let papers = [];

        for(let i = 0; i < degree.potentialPapers.length; i++)
        {
            for(let j = 0; j < degree.potentialPapers[i].compulsoryPapers.length; j++)
            {
                let paper = degree.potentialPapers[i].compulsoryPapers[j];
                papers.push(paper);
                points += paper.points;
            }

            let paper = degree.potentialPapers[i].chooseOnePapers[0];
        }

        for(let i = 0; i < degree.potentialPapers.length && pointsUsed < points; i++)
        {
            for(let j = 1; j < degree.potentialPapers[i].optionalPapers.length; j++)
            {
                let paper = degree.potentialPapers[i].optionalPapers[j];
                papers.push(paper);
                points += paper.points;
            }
        }

        return papers;
    }
}

async function launchPage(url)
{
    const b = await puppeteer.launch();
    const p = await b.newPage();
    await p.goto(url);
    return { browser : b, page : p};
}

/*async function getPageByElement(url)
{
    getPageByElement(launchPage(url));
}*/

async function getPageByElementText(link, selector, text)
{
    let elements = getElementsBySelector(link, selector);
    /*let match = elements.find((e) =>
    {
        return e.text == text;
    });*/

    for(let i = 0; i < elements.length; i++)
    {
        if(elements[i].text == text)
        {
            return elements[i].text;
        }
    }

    return null;
    /*var result = null;
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

    return result;*/
}

async function getElementsBySelector(link, selector)
{
    return await accessHTML(link, ($) =>
    {
        let elements = [];
        $(selector).each((index, element) =>
        {
            elements.push(
            {
                "link": $(element).attr("href"),
                "text": $(element).text()
            });
        });
        return elements;
    });
    /*const result = await webpage.page.evaluate((selector) =>
    {
        let elements = Array.from(document.querySelectorAll(selector));
        let links = elements.map(element => 
        {
            return { "link" : element.href, "text" : element.textContent };
        });
        return links;
    }, selector);
    return result;*/
}

async function accessProgramme(prog)
{
    //const webpage = await launchPage(undergradProgrammes);
    return await getPageByElementText(undergradProgrammes, "div.col-sm-6 ul li a", prog);
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

async function getPapersForMajor(major, degree, prog, webpage, callback)
{
    if(webpage == null)
    {
        webpage = await accessMajor(major, degree, prog, webpage);
    }

    let paperStrings = [];
    
    // Retrieves all lines of text corresponding to a paper and their year
    await accessHTML(webpage, ($) =>
    {
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

            $.each($(y).nextAll("h3:contains('choose one of')").first().nextAll("ul").children("li"), (index, p) =>
            {
                paperStrings.push(
                {
                    t: $(p).text(), 
                    y: year
                });
            });

            /*let optionalPaper = $(y).nextAll("h3:contains('choose one of')").first().nextAll("ul").children("li").first();
            paperStrings.push(
            {
                t: $(optionalPaper).text(), 
                y: year
            });*/
        });

        let strings = paperStrings;
        let papers = [];

        for(let i = 0; i < strings.length; i++)
        {
            papers[i] = Paper.textToPaper(strings[i].t, strings[i].y);
        }

        callback(papers);
        
        //return paperStrings;
    });
    /*console.log(paperStrings);
    let strings = paperStrings;
    let papers = [];

    for(let i = 0; i < strings.length; i++)
    {
        papers[i] = Paper.textToPaper(strings[i].t, strings[i].y);
    }

    //await webpage.page.close();

    return papers;*/
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

getPapersForMajor("Software Development", "Bachelor of Computer and Information Sciences", "Engineering, computer and mathematical sciences", null, (papers)=>
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

async function accessHTML(url, callback)
{
    request(url, function(error, response, html)
    {
        if(!error)
        {
            callback(cheerio.load(html));
        }
    });
}

/*var $ = accessHTML("https://scotch.io/tutorials/scraping-the-web-with-node-js", ($) =>
{
    console.log($("p").text());
});*/

//console.log(accessHTML("https://scotch.io/tutorials/scraping-the-web-with-node-js"));

module.exports =
{
    Paper,
    launchPage,
    getPapersForMajor
}
