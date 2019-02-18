const puppeteer = require('puppeteer');
const request = require('request-promise');
var fs = require('fs');
var XLSX = require('xlsx');
var sleep = require('system-sleep');
(async () => {

    try{
        // Viewport && Window size
        const width = 1080
        const height = 1080

        const browser = await puppeteer.launch({
            headless: true,
            args:[
               
                '--ignore-certificate-errors',
                '--ignore-certificate-errors-spki-list '
             ]
        } );
        var sheetToProcess = 0
        var page = await browser.newPage();
        var workbook = XLSX.readFile('./astar.xlsx');
        var sheet_name_list = workbook.SheetNames;
        console.log(XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[sheetToProcess]]));
        var temp = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[sheetToProcess]])
        await page.setViewport({ width, height })
        var startIndex= 10001
        var endIndex = 20000
        await page.goto('https://www.wikidata.org/w/index.php?search');
        for(let x = startIndex; x < endIndex ; x++){
            console.log("processing "+ x +" out of "+temp.length)
            if(x==0 ){
                await page.goto('https://www.wikidata.org/w/index.php?search');
            }
            if(x%20 ==0){
                console.log("here")
                await page.close();
                page = await browser.newPage();
                await page.goto('https://www.wikidata.org/w/index.php?search');
            }
            if(  temp[x].token != "null"){

                
                await page.type('input[name="search"]', temp[x].token) 
               
                await page.click('button[type="submit"]')
                await page.waitForNavigation()
                var listofitems = await page.$$eval('#mw-content-text > div.searchresults > ul > li > div.mw-search-result-heading > a'
                 ,as => as.map(a =>({href:a.href , title : a.title})))
                if(listofitems.length > 0){
                    for (let y = 0 ; y < 4 ; y++){
                        if(listofitems[y].title.match(/[a-zA-Z ]+/).toString().replace(/^[ ]+|[ ]+$/g,'')== temp[x].token){
                            if(listofitems[y].href.match("https://www.wikidata.org/wiki/(.*)")[1].toString().substring(0, 1)!='P')
                            temp[x].Wikidata = "B-"+listofitems[y].href.match("https://www.wikidata.org/wiki/(.*)")[1]
                        }
                        
                    }
                }
    
                await page.click('input[name="search"]', {clickCount: 3})
                if(x%5 ==0){
                    console.log("sleeping")
                    sleep(2*1000); 
                    
                    
                }
                else if(x%2 ==0){
                    console.log("sleeping")
                    sleep(2*1000); 

                }
            }

        }
        var ws = XLSX.utils.json_to_sheet(temp);
        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "report");
        XLSX.writeFile(wb, 'out index from '+startIndex +"-"+ endIndex +" "+ (Date.now() % 171761)+'.xlsx');
        
     
        
        

        await page.setRequestInterception(true); // Allow request interception before click to download file
        // page.click('button#submitButton');

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


