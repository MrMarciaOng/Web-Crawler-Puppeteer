const puppeteer = require('puppeteer');
const request = require('request-promise');
var fs = require('fs');
var XLSX = require('xlsx');

(async () => {
    try{
        // Viewport && Window size
        const width = 1980
        const height = 1080

        const browser = await puppeteer.launch({
            headless: false,
            args:[
                '--start-maximized' 
             ]
        } );
        const page = await browser.newPage();
        var workbook = XLSX.readFile('./excel_anno_40sheets_JiewenExample.xlsx');
        var sheet_name_list = workbook.SheetNames;
        console.log(XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[3]]));
        var temp = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[3]])
        await page.setViewport({ width, height })

        for(let x = 0; x < temp.length ; x++){
            await page.goto('https://www.wikidata.org/w/index.php?search');
            await page.type('input[name="search"]', temp[x].token) //document queryselector finding input tag with attribute name = "email"
            await page.click('button[type="submit"]')
            await page.waitForNavigation()
            var listofitems = await page.$$('.mw-search-result-heading > a')
            console.log(listofitems)
            for (let y = 0 ; y < listofitems.length ; y++){

                console.log(await listofitems[y].$eval('[attr=title]'))
            }

        }
        

        
     
        
        
        await page.goto('url');

        await page.type('input[name="startDate"]', '01-09-2018') //form text input
        await page.type('input[name="endDate"]', '15-09-2018')
        await page.setRequestInterception(true); // Allow request interception before click to download file
        page.click('button#submitButton');

        const xRequest = await new Promise(resolve => { //download method
            page.on('request', request => {
                request.abort();
                resolve(request);
            });
        });
        const options = {
            encoding: null,
            method: xRequest._method,
            uri: xRequest._url,
            body: xRequest._postData,
            headers: xRequest._headers
        }
        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
        /* add the cookies */
        const cookies = await page.cookies();
        options.headers.Cookie = cookies.map(ck => ck.name + '=' + ck.value).join(';');
        
        /* resend the request */
        const response = await request(options);
        fs.writeFile("./excel"+getRandomInt(1,5000000)+".xlsx", response, function(err) {
            if (err) throw err;
            console.log("Download done")
        });

        await browser.close();

    }catch(e){

        console.log(e)
    }
})();