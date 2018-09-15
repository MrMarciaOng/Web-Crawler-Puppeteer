const puppeteer = require('puppeteer');
const request = require('request-promise');
var fs = require('fs');


(async () => {
    try{
        // Viewport && Window size
        const width = 1980
        const height = 1080

        const browser = await puppeteer.launch({
            headless: true,
            args:[
                '--start-maximized' 
             ]
        } );
        const page = await browser.newPage();
      
        await page.setViewport({ width, height })
        await page.goto('url');

        await page.type('input[name="email"]', 'xxx') //document queryselector finding input tag with attribute name = "email"
        await page.type('input[name="password"]', 'xxx')
        await page.click('button[type="submit"]')
        await page.waitForNavigation()
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