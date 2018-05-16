const request = require("request");
const cheerio = require("cheerio");
const util = require("./util");

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
        
        if(words.length < 4)
        {
            throw new Error("Invalid text format");
        }

        for(let i = 1; i < words.length - 2; i++)
        {
            pName += words[i] + " ";
        }
    
        return new Paper(words[0], pName.trim(), year, parseInt(words[words.length - 2].substr(1)));
    }
}

class PapersForYear
{
    constructor(year, compulsoryPapers, chooseOnePapers, electives)
    {
        this.year = year;
        this.compulsoryPapers = compulsoryPapers;
        this.chooseOnePapers = chooseOnePapers;
        this.electives = electives;
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

        // If there are still points to assign, add other optional papers
        for(let i = 0; i < degree.potentialPapers.length && pointsUsed < points; i++)
        {
            for(let j = 1; j < degree.potentialPapers[i].optionalPapers.length; j++)
            {
                let paper = degree.potentialPapers[i].optionalPapers[j];
                papers.push(paper);
                points += paper.points;
            }
        }

        // If there are still points to assign, add electives
        for(let i = 0; i < degree.electives.length && pointsUsed < points; i++)
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

// Returns all papers for the first listed major of the specified degree
async function getPapersForDegree(degree, webpage, callback, prog)
{
    findDegree(degree, async (page) => 
    {
        accessHTML(page, async ($) =>
        {
            let m = $("div.panel-body ul li a").first();
            getPapersForMajor($(m).text(), $(m).attr("href"), callback);
        });
    });
}

async function getPapersForMajor(major, webpage, callback, degree, prog)
{
    let retrievePapers = () =>
    {
        // Retrieves all lines of text corresponding to a paper and their year
        accessHTML(webpage, ($) =>
        {
            console.log("Yo");
            let paperStrings = [];
            $("h2:contains('Year')").each((index, y) =>
            {
                let year = parseInt($(y).text().split(" ")[1]);
                $(y).nextAll("h3:contains('Complete the following papers')").nextAll("ul").first().find("li a.paperbox").each((index, p) =>
                {
                    paperStrings.push(
                    {
                        t: $(p).text(), 
                        y: year
                    });
                });

                $(y).nextAll("h3:contains('And choose one of')").nextAll("ul").first().find("li a.paperbox").each((index, p) =>
                {
                    paperStrings.push(
                    {
                        t: $(p).text(), 
                        y: year
                    });
                });
            });

            $("h3:contains('Level')").each((index, lvl) =>
            {
                // Converts level to year e.g. Level 5 -> Year 1
                let year = parseInt($(lvl).text().split(" ")[1]) - 4;

                $(lvl).nextAll("ul").first().find("li a.paperbox").each((index, p) =>
                {
                    paperStrings.push(
                    {
                        t: $(p).text(), 
                        y: year
                    });
                });
            });

            let papers = [];

            console.log(paperStrings);

            paperStrings.map((p) =>
            {
                try
                {
                    papers.push(Paper.textToPaper(p.t, p.y));
                }
                catch
                {
                }
            });

            callback(papers);
        });
    }

    if(degree == null)
    {
        findMajor(major, retrievePapers);
    }
    else
    {
        retrievePapers();
    }
}

async function accessHTML(url, callback)
{
    request.get(url, function(error, response, html)
    {
        if(!error)
        {
            callback(cheerio.load(html));
        }
    });
}

async function findLinks(text, page, selectors, callback, count = 0)
{
    if(count == 0)
    {
        text = text.trim().toLowerCase();
    }

    //console.log(page);

    accessHTML(page, async ($) =>
    {
        if(count == selectors.length - 1)
        {
            $(selectors[count]).each((i, element) =>
            {
                //console.log($(element).text());
                if($(element).text().trim().toLowerCase() == text)
                {
                    console.log("Heyo");
                    callback($(element).attr("href"));
                    return;
                }
            });
        }
        else
        {
            let links = [];
            $(selectors[count]).each((i, element) =>
            {
                links.push($(element).attr("href"));
            });

            for(let i = 0; i < links.length; i++)
            {
                //console.log(links[i]);
                await findLinks(text, links[i], selectors, callback, count + 1);
            }
        }
    });
}

async function findDegree(degree, callback)
{
    findLinks(degree, undergradProgrammes, ["div.col-sm-6 ul li a", "ul li a"], callback);
}

async function findMajor(major, callback)
{
    findLinks(major, undergradProgrammes, ["div.col-sm-6 ul li a", "div.panel-body ul li a", "div.tab-pane ul li a"], callback);
}

getPapersForMajor("Software Development", (link) =>
{
    console.log(link);
});

module.exports =
{
    Paper,
    getPapersForMajor,
    accessHTML,
    findDegree,
    findMajor,
    getPapersForDegree
}
