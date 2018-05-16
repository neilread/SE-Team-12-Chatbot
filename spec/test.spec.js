const jas = require("jasmine");
const scrape = require("../scrape");

describe("textToPaper()", () =>
{
    it("should convert a string in the form [code] [name] ([points] points) to a Paper object", () =>
    {
        expect(scrape.Paper.textToPaper("COMP500 Programming 1 (15 points)", 1)).toEqual(new scrape.Paper("COMP500", "Programming 1", 1, 15));
    });
    
    it("should throw an error if text is not a string", () =>
    {
        expect(() => scrape.Paper.textToPaper(2.5, 1)).toThrow(new Error("text is not of type string"));
    });
});

describe("launchPage()", () =>
{
    it("should produce a webpage based on the input url", (done) =>
    {
        let webpage = scrape.launchPage("http://webscraper.io/test-sites").then((value) =>
        {
            expect(webpage.page.plainText().startsWith("Test sites")).toBe(true);
            done();
        });        
    });
});

describe("getPapersForMajor()", () =>
{
    it("It should return an appropriate list of papers that will qualify a student for a specific major and degree", () =>
    {
        let codes = [];
        let papers = scrape.getPapersForMajor("Software Development", "Bachelor of Computer and Information Sciences");
        for(let i = 0; i < papers.length; i++)
        {
            codes[i] = papers[i].code;
        }

        expect(codes).toBe(["COMM501", "COMP500", "COMP501", "COMP502", "COMP503", "ENEL504", "INFS500", "MATH500", "COMP600", "COMP602", "COMP603", "INFS600", "INFS601", "COMP604", "COMP704", "COMP719", "ENSE701", "COMP713"])
    });
});