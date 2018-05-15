const jas = require("jasmine");
const scrape = require("../scrape");

describe("textToPaper()", () =>
{
    it("should convert a string in the form [code] [name] ([points] points) to a Paper object", () =>
    {
        expect(scrape.Paper.textToPaper("COMP500 Programming 1 (15 points)", 1)).toEqual(new scrape.Paper("COMP500", "Programming 1", 1, 15));
    });
});

describe("textToPaper()", () =>
{
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