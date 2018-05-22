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

describe("findDegree()", () =>
{
    it("It should retrieve the link associated with a passed degree", (done) =>
    {
        scrape.findDegree("Bachelor of Computer and Information Sciences", (link) =>
        {
            expect(link).toEqual("https://www.aut.ac.nz/study/study-options/engineering-computer-and-mathematical-sciences/courses/bachelor-of-computer-and-information-sciences");
            done();
        });
    });
}, 30000);

describe("findMajor()", () =>
{
    it("It should retrieve the link associated with a passed major", (done) =>
    {
        scrape.findMajor("Software Development", (link) =>
        {
            expect(link).toEqual("https://www.aut.ac.nz/study/study-options/engineering-computer-and-mathematical-sciences/courses/bachelor-of-computer-and-information-sciences/software-development-major");
            done();
        });
    }, 30000);
});

describe("getPapersForMajor()", () =>
{
    it("It should return an appropriate list of papers that will qualify a student for a specific major and degree", (done) =>
    {
        let papers = scrape.getPapersForMajor("Software Development",
          "https://www.aut.ac.nz/study/study-options/engineering-computer-and-mathematical-sciences/courses/bachelor-of-computer-and-information-sciences/software-development-major",
           (papers) =>        
        {
            let codes = [];
            for(let i = 0; i < papers.length; i++)
            {
                codes[i] = papers[i].code;
            }

            expect(codes).toEqual(["COMM501", "COMP500", "COMP501", "COMP502", "COMP503", "ENEL504", "INFS500", "MATH500", "MATH501", "MATH502", "STAT500",
            "COMP600", "COMP602", "COMP603", "INFS600", "INFS601", "COMP604", "INFS602", "COMP704", "COMP719", "ENSE701", "COMP713", "COMP721", "COMP505",
            "ENSE501", "ENSE502", "COMP612", "MATH604", "COMP705", "COMP710", "COMP716", "COMP720", "COMP724", "INFS700"]);
            done();
        }, "Bachelor of Computer and Information Sciences",
        "Engineering, computer and mathematical sciences");
    }, 30000);

    it("It should return an appropriate list of papers that will qualify a student for a specific major if the major's degree is not specified", (done) =>
    {
        let papers = scrape.getPapersForMajor("Software Development",
          "https://www.aut.ac.nz/study/study-options/engineering-computer-and-mathematical-sciences/courses/bachelor-of-computer-and-information-sciences/software-development-major",
           (papers) =>        
        {
            let codes = [];
            for(let i = 0; i < papers.length; i++)
            {
                codes[i] = papers[i].code;
            }

            expect(codes).toEqual(["COMM501", "COMP500", "COMP501", "COMP502", "COMP503", "ENEL504", "INFS500", "MATH500", "MATH501", "MATH502", "STAT500",
            "COMP600", "COMP602", "COMP603", "INFS600", "INFS601", "COMP604", "INFS602", "COMP704", "COMP719", "ENSE701", "COMP713", "COMP721", "COMP505",
            "ENSE501", "ENSE502", "COMP612", "MATH604", "COMP705", "COMP710", "COMP716", "COMP720", "COMP724", "INFS700"]);
            done();
        });
    }, 30000);
});

describe("getPapersForDegree()", () =>
{
    it("should return all papers for the first listed major of the degree", (done) =>
    {
        scrape.getPapersForDegree("Bachelor of Computer and Information Sciences", null, (papers) =>
        {
            let codes = [];
            for(let i = 0; i < papers.length; i++)
            {
                codes[i] = papers[i].code;
            }

            expect(codes).toEqual(["COMM501", "COMP500", "COMP501", "COMP502", "COMP503", "ENEL504", "INFS500", "MATH500", "MATH501", "MATH502", "STAT500", 
            "COMP600", "INFS600", "STAT600", "STAT601", "INFS601", "STAT603", "COMP704", "STAT700", "STAT702", "COMP723", "STAT701", "COMP505",
            "ENSE501", "ENSE502", "COMP612", "MATH604", "COMP705", "COMP710", "COMP716", "COMP720", "COMP724", "INFS700"]);

            done();
        });
    }, 30000);
});

/*describe("getCourseForMajor()", () =>
{
    it("should return a list of papers that meet the requirements for the specified major and degree.", (done) =>
    {
        scrape.getCourseForMajor("Software Development", (papers) =>
        {
            let codes = [];
            for(let i = 0; i < papers.length; i++)
            {
                codes[i] = papers[i].code;
            }

            expect(codes).toEqual(["COMM501", "COMP500", "COMP501", "COMP502", "COMP502", "COMP503", "ENEL504",
             "INFS500", "MATH500", "COMP600", "COMP602", "COMP603", "INFS600", "INFS601", "COMP604", "COMP704", 
             "COMP719", "ENSE701", "COMP713", "MATH501", "MATH502", "STAT500", "INFS602", "COMP721"]);

            done(); 
        }); 
    });
});*/