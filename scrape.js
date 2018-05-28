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
    constructor(code, name, level, points)
    {
        this.code = code;
        this.name = name;
        this.level = level;
        this.points = points;
    }

    toString()
    {
        return this.code;
    }

    /**
     * Converts a string to a paper with the passed year.
     * Text is in the format [code] [name] ([points] points)
     */
    static textToPaper(text)
    {
        util.checkIsType(text, "string", "text");

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
    
        return new Paper(words[0], pName.trim(), getFirstDigit(words[0]), parseInt(words[words.length - 2].substr(1)));
    }

    static getCodes(papers)
    {
        let codes = [];
        papers.forEach((p) =>
        {
            codes.push(p.code);
        })
        return codes;
    }
}

class PapersForYear
{
    constructor(year = 1, compulsoryPapers = [], chooseOnePapers = [])
    {
        this.year = year;
        this.compulsoryPapers = compulsoryPapers;
        this.chooseOnePapers = chooseOnePapers;
    }

    toString()
    {
        return this.year + ": " + this.compulsoryPapers + ", " + this.chooseOnePapers;
    }
}

class Degree
{
    constructor(points = 360, numYears = 3, papersForYears = [], electives = [])
    {
        this.points = points;
        this.numYears = numYears;
        this.papersForYears = papersForYears;
        this.electives = electives;
    }

    static getPapers(degree)
    {
        let papers = [];
        
        degree.papersForYears.forEach((py) =>
        {
            py.compulsoryPapers.forEach((p) =>
            {
                papers.push(p);
            });

            py.chooseOnePapers.forEach((p) =>
            {
                papers.push(p);
            });
        });

        degree.electives.forEach((p) =>
        {
            papers.push(p);
        });

        return papers;
    }

    toString()
    {
        return "(" + points + ", " + this.numYears + "): \n" + this.papersForYears + "\n" + this.electives;
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
                pointsUsed += paper.points;
            }

            console.log("heyo");
            let paper = degree.papersForYears[i].chooseOnePapers[0];
            papers.push(paper);
            pointsUsed += paper.points;
        }

        // If there are still points to assign, add other optional papers
        for(let i = 0; i < degree.papersForYears.length && pointsUsed < degree.points; i++)
        {
            for(let j = 1; j < degree.papersForYears[i].chooseOnePapers.length && pointsUsed < degree.points; j++)
            {
                let paper = degree.papersForYears[i].chooseOnePapers[j];
                papers.push(paper);
                pointsUsed += paper.points;
            }
        }

        // If there are still points to assign, add electives
        for(let i = 0; i < degree.electives.length && pointsUsed < degree.points; i++)
        {
            let paper = degree.electives[i];
            papers.push(paper);
            pointsUsed += paper.points;
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
            let degree = new Degree();
            let paperStrings = [];
            $("h2:contains('Year')").each((index, y) =>
            {
                degree.papersForYears[index] = new PapersForYear(index + 1);

                // Compulsory papers
                $(y).nextAll("h3:contains('Complete the following papers')").nextAll("ul").first().find("li a.paperbox:contains('points')").each((i, p) =>
                {
                    paperStrings.push($(p).text());
                    degree.papersForYears[index].compulsoryPapers.push(Paper.textToPaper($(p).text()));
                });

                // 'Choose one' papers
                $(y).nextAll("h3:contains('And choose one of')").nextAll("ul").first().find("li a.paperbox:contains('points')").each((i, p) =>
                {
                    paperStrings.push($(p).text());
                    degree.papersForYears[index].chooseOnePapers.push(Paper.textToPaper($(p).text()));
                });
            });

            // Electives
            $("h3:contains('Level')").each((index, lvl) =>
            {
                $(lvl).nextAll("ul").first().find("li a.paperbox:contains('points')").each((index, p) =>
                {
                    paperStrings.push($(p).text());
                    degree.electives.push(Paper.textToPaper($(p).text()));
                });
            });

            let papers = [];

            paperStrings.map((p) =>
            {
                try
                {
                    papers.push(Paper.textToPaper(p));
                }
                catch
                {
                }
            });

            //callback(papers);
            callback(degree);
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

async function getCourseForMajor(major, callback)
{
    await getPapersForMajor(major, null, (degreePapers) =>
    {
        callback(Degree.assignPapersToStudent(degreePapers));
    });
}

async function getSuitableJobs(theMajor, callback)
{
    findMajor(theMajor, (page) => 
    {
        console.log(page);

        accessHTML(page, ($) => 
        {
            let jobArray = [];

            $("div.col-sm-8 ul li ").each( (i, e) =>
            {
               jobArray.push($(e).text()); 
            });

            callback(jobArray);
        });
    });
}

module.exports =
{
    Paper,
    getPapersForMajor,
    accessHTML,
    findDegree,
    findMajor,
    getPapersForDegree,
    getCourseForMajor,
    Degree,
    getSuitableJobs
}
