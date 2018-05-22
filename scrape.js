const request = require("request");
const cheerio = require("cheerio");
const util = require("./util");

const undergradProgrammes = "https://www.aut.ac.nz/study/study-options";

var knownDegrees = {
    "bachelor of computer and information sciences" : "https://www.aut.ac.nz/study/study-options/engineering-computer-and-mathematical-sciences/courses/bachelor-of-computer-and-information-sciences"
}

var knownMajors = {
    "software development" : "https://www.aut.ac.nz/study/study-options/engineering-computer-and-mathematical-sciences/courses/bachelor-of-computer-and-information-sciences/software-development-major"
}

function getFirstDigit(string)
{
    var char;
    for(let i = 0; i < string.length; i++)
    {
        let char = parseInt(string[i]);
        if(Number.isInteger(char))
        {
            return char;
        }
    }

    return null;
}

function getKnownDegreeEntry(degree)
{
    return knownDegrees[degree.trim().toLowerCase()];
}

function updateKnownDegrees(degree, link)
{
    degree = degree.trim().toLowerCase();
    if(!knownDegrees[degree])
    {
        knownDegrees[degree] = link;
    }
}

function getKnownMajorEntry(major)
{
    return knownMajors[major.trim().toLowerCase()];
}

function updateKnownMajors(major, link)
{
    major = major.trim().toLowerCase();
    if(!knownMajors[major])
    {
        knownMajors[major] = link;
    }
}

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
        this.papersForYears = papersForYears;
    }

    static assignPapersToStudent(degree)
    {
        let pointsUsed = 0;
        let papers = [];

        for(let i = 0; i < degree.papersForYears.length; i++)
        {
            for(let j = 0; j < degree.papersForYears[i].compulsoryPapers.length; j++)
            {
                let paper = degree.papersForYears[i].compulsoryPapers[j];
                papers.push(paper);
                points += paper.points;
            }

            let paper = degree.papersForYears[i].chooseOnePapers[0];
        }

        // If there are still points to assign, add other optional papers
        for(let i = 0; i < degree.papersForYears.length && pointsUsed < points; i++)
        {
            for(let j = 1; j < degree.papersForYears[i].optionalPapers.length; j++)
            {
                let paper = degree.papersForYears[i].optionalPapers[j];
                papers.push(paper);
                points += paper.points;
            }
        }

        // If there are still points to assign, add electives
        for(let i = 0; i < degree.electives.length && pointsUsed < points; i++)
        {
            for(let j = 1; j < degree.papersForYears[i].optionalPapers.length; j++)
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
    await findDegree(degree, async (link) => 
    {
        await accessHTML(link, async ($) =>
        {
            let m = $("h2:contains('Majors')").next().find("li a").first();
            await getPapersForMajor($(m).text(), $(m).attr("href"), callback);
        });
    });
}

async function getPapersForMajor(major, webpage, callback, degree, prog)
{
    let retrievePapers = async (link) =>
    {
        // Retrieves all lines of text corresponding to a paper and their year
        await accessHTML(link, ($) =>
        {
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

    webpage = webpage ? webpage : getKnownMajorEntry(major);

    if(webpage == null)
    {
        await findMajor(major, retrievePapers);
    }
    else
    {
        await retrievePapers(webpage);
    }
}

async function accessHTML(url, callback)
{
    await request.get(url, async (error, response, html) =>
    {
        if(!error)
        {
            await callback(cheerio.load(html));
        }
    });
}

async function findLinks(text, page, selectors, callback, count = 0)
{
    if(count == 0)
    {
        text = text.trim().toLowerCase();
    }

    await accessHTML(page, async ($) =>
    {
        let list = $(selectors[count]).next().find("li a");
        if(count == selectors.length - 1)
        {
            $(list).each((i, element) =>
            {
                if($(element).text().trim().toLowerCase() == text)
                {
                    callback($(element).attr("href"));
                    return;
                }
            });
        }
        else
        {
            let links = [];
            $(list).each((i, element) =>
            {
                links.push($(element).attr("href"));
            });

            for(let i = 0; i < links.length; i++)
            {
                await findLinks(text, links[i], selectors, callback, count + 1);
            }
        }
    });
}

async function findDegree(degree, callback)
{
    await findLinks(degree, undergradProgrammes, ["h2:contains('Browse study options')", "h2:contains('Bachelor's degree')"], (link) =>
    {
        updateKnownDegrees(degree, link);
        callback(link);
    });
}

async function findMajor(major, callback)
{
    await findLinks(major, undergradProgrammes, ["h2:contains('Browse study options')", "h2:contains('Bachelor's degree')", "h2:contains('Major')"], (link) =>
    {
        updateKnownMajors(major, link);
        callback(link);
    });
}

module.exports =
{
    Paper,
    getPapersForMajor,
    accessHTML,
    findDegree,
    findMajor,
    getPapersForDegree
}
