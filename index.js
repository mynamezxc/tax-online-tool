// Form upload iframe
// https://thuedientu.gdt.gov.vn/etaxnnt/Request?&dse_sessionId=37o3Cd_RrtQpKRGGnyZUO49&dse_applicationId=-1&dse_pageId=9&dse_operationName=uploadTaxOnlineProc&dse_processorState=initial&dse_nextEventName=start
// Status NopToKhai in javascript
// https://thuedientu.gdt.gov.vn/etaxnnt/static/script/chrome/page.js
const eSginer_path = __dirname + "/eSigner";
const key = "e8e3fa20d2588dfb1d1281caaf94332c";
const puppeteer = require('puppeteer');
const http = require('http');
const express = require('express');
const fs = require('fs');
const app = express()
const port = 3000
const path = require('path');
app.use(express.static('public'))
var browsers = [];

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

async function getSession(page) {
    let current_url = await page.url();
    let start = current_url.indexOf("=") + 1;
    let end = current_url.indexOf("&dse_applicationId") - 1;
    let session = current_url.substring(start, end+1);
    return session;
}

async function createBrowser(id) {
    const browser = await puppeteer.launch(
        {
            args: [
                // '--no-sandbox', '--disable-setuid-sandbox',
                // '--load-extension='+eSginer_path,
                '--disable-extensions-except='+eSginer_path
            ], headless: false
        }
    );
    try {
        let url = "https://thuedientu.gdt.gov.vn"
        const page = await browser.newPage();
        await page.setViewport({ width: 1366, height: 768});
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36');
        await page.goto(url, {timeout: 30000, waitUntil: 'networkidle0' });
        let session = await getSession(page);
        // url = "https://thuedientu.gdt.gov.vn/etaxnnt/Request?&dse_sessionId="+session+"&dse_applicationId=-1&dse_pageId=3&dse_operationName=corpIndexProc&dse_errorPage=error_page.jsp&dse_processorState=initial&dse_nextEventName=home";
        url = "https://thuedientu.gdt.gov.vn/etaxnnt/Request?&dse_sessionId="+session+"&dse_applicationId=-1&dse_pageId=7&dse_operationName=corpIndexProc&dse_errorPage=error_page.jsp&dse_processorState=initial&dse_nextEventName=login"
        await page.goto(url, {timeout: 30000, waitUntil: 'networkidle0' });
        await page.screenshot({path: "public/captcha/"+id+'.png', clip:{x: 944, y: 198, width: 74, height: 35}});
        return browser;
    } catch (error) {
        console.log(error);
        await browser.close();
        return false;
    }
}

async function fillCaptchaAndLogin(browser_id, captcha, username, password) {
    let pages = await browsers[browser_id].pages();
    var page = pages[0];
    if (pages.length == 2) {
        page = pages[1];
    }
    
    let script = `
        $("#_userName").val("${username}");
        $("#password").val("${password}");
        $("#vcode").val("${captcha}");
        $("#loginForm").submit();
    `;
    await page.addScriptTag({"content": script});
    await page.waitForNavigation();
    let content = await page.content();
    if(content.search("btn_logout.gif") != -1 || content.search("Hệ thống đang thực hiện kiểm tra bản cập nhật. Vui lòng chờ trong giây lát") != -1) {
        return true;
    } else {
        await page.screenshot({path: "public/captcha/"+browser_id+'.png', clip:{x: 944, y: 198, width: 74, height: 35}});
        return false;
    }
}

async function closeBrowser(browser) {
    await browser.close();
}

async function eSigner(browser_id, filename) {
    let pages = await browsers[browser_id].pages();
    let page = pages[0];
    if (pages.length == 2) {
        page = pages[1];
    }
    try {
        var tax_element = await page.$(".text_den");
        var tax_id = await page.evaluate(tax_element => tax_element.textContent, tax_element);
        if(tax_id != "") {
            var attribute_arr = path.basename(filename).split("-");
            if(attribute_arr[1].length == 10) {
                var file_tax_id = attribute_arr[1]+"000";
            } else {
                var file_tax_id = attribute_arr[1];
            }
            if(tax_id.length == 10) {
                tax_id = tax_id + "000";
            }
            
            if(file_tax_id != tax_id) {
                return false;
            }
        }
    } catch(err) {
        return false;
    }
    
    let session = await getSession(page);
    // await page.evaluate(_ => {
    //     window.scrollBy(0, 0);
    // });
    // let mouse = await page.mouse;
    // await mouse.click(677, 115, {delay: 200});
    // await delay(1500);
    // await mouse.click(839, 150, {delay: 200});
    // await delay(1000);

    let url = "https://thuedientu.gdt.gov.vn/etaxnnt/Request?&dse_sessionId="+session+"&dse_applicationId=-1&dse_pageId=9&dse_operationName=uploadTaxOnlineProc&dse_processorState=initial&dse_nextEventName=start";
    // let url = "https://thuedientu.gdt.gov.vn/etaxnnt/Request?&dse_sessionId="+session+"&dse_applicationId=-1&dse_pageId=6&dse_operationName=corporateHomeProc&dse_errorPage=error_page.jsp&dse_processorState=initial&dse_nextEventName=start";
    let newPage = await browsers[browser_id].newPage();
    await newPage.setViewport({ width: 1366, height: 768});
    await newPage.goto(url);
    var real_name = path.basename(filename);
    var real_path = __dirname.replace("\\", "/") + "/xml/" + real_name;
    
    let script = `
        $("#fullPathFileName").val('${real_path}');
        $("#tkhaiFormat").val("9");
        $("#fileName").val("${real_name}");
        $("#fullPathFileName").val('${real_path}');
        $("#tkhaiFormat").val("9");
        $("#fileName").val("${real_name}");
        setTimeout(function() {
            checkSelectFileUpload();
            // uploadFile();
        }, 1000);
    `;
    await newPage.addScriptTag({"content": script});
    await delay(4000);
    let content = await newPage.content();
    await newPage.close();
    if(content.search("frm_member") != -1) {
        return true;
    } else {
        return false;
    }
}

app.get('/:browser_id', async (req, res) => {
    var browser_id = req.params.browser_id;
    if(req.query.key != key) {
        res.send({"status": false, "message": "Key error"});
        return;
    }
    if(browsers[browser_id]) {
        try {
            await closeBrowser(browsers[browser_id]);
            delete browsers[browser_id];
            console.log("Reopen browser " + browser_id);
        } catch (error) {
            console.log("Browser close with error");
        }
    }
    var browser = await createBrowser(browser_id);
    if (browser) {
        browsers[id] = browser;
        res.send({"id": id, "status": true, "message":  "Waiting for captcha", "image": "captcha/"+id+".png"});
    } else {
        res.send({"id": id, "status": false, "message": "Connection error"});
    }
});

app.get('/login/:browser_id/:captcha/:username/:password', async (req, res) => {

    if(req.query.key != key) {
        res.send({"status": false, "message": "Key error"});
        return;
    }
    
    var browser_id = req.params.browser_id
    var captcha = req.params.captcha
    var username = req.params.username;
    var password = req.params.password;
    
    if (browsers[browser_id] && captcha != "" && username != "" && password != "") {
        var logined = await fillCaptchaAndLogin(browser_id, captcha, username, password);
        if (!logined) {
            res.send({"id": browser_id, "status": false, "message": "Captcha, username or password was wrong. Please try again", "image": "captcha/"+browser_id+".png"});
        } else {
            fs.unlink("./public/captcha/"+browser_id+".png", (err) => {
                if (err) {
                    console.log("failed to delete local image:"+err);
                } else {
                    console.log('successfully deleted local image');                               
                }
            });
            res.send({"id": browser_id, "status": true, "message": "Login success"});
        }
    } else {
        res.send({"id": browser_id, "status": false, "message": "Missing parameters", "image": "captcha/"+browser_id+".png"});
    }
});

app.post('/upload-file/:browser_id', async (req, res) => {
    if(req.query.key != key) {
        res.send({"status": false, "message": "Key error"});
        return;
    }
    var browser_id = req.params.browser_id
    var url = req.query.url;
    var error = "";
    var real_filename = path.basename(url);
    const filename = "./xml/"+real_filename;
    if (browsers[browser_id] && url != "") {
        fs.open(filename, 'w', async function (err, file) {
            if (err) {
                error = "failed to create file " + filename + ". Error message: " + err;
                console.log(error);
            } else {
                console.log('File is created successfully');
            }
        }); 
        const file = fs.createWriteStream(filename);
        const request = http.get(url, function(response) {
            response.pipe(file);
        });
        var uploaded = await eSigner(browser_id, filename);
        if(uploaded) {
            // try {
            //     await closeBrowser(browsers[browser_id]);
            //     delete browsers[browser_id];
            // } catch (err) {
            //     response["error"] = err;
            // }
            res.send({"id": browser_id, "status": true, "message": "Upload success"});
            return;
        } else {
            res.send({"id": browser_id, "status": false, "message": "Content or filename invalid with this account, syntax required"});
            return;
        }
    } else {
        error = "Browser id not alive or file url invalid. Please try again.";
    }

    if (error != "") {
        res.send({"id": browser_id, "status": false, "message": error});
    } else {
        res.send({"id": browser_id, "status": true, "message": "Upload success"});
    }
});

app.get("/close-browser/:browser_id", async (req, res) => {
    var browser_id = req.params.browser_id;
    if(req.query.key != key) {
        res.send({"status": false, "message": "Key error"});
        return;
    }
    var response = {"status": true, "message":"closed"}
    try {
        await closeBrowser(browsers[browser_id]);
        delete browsers[browser_id];
    } catch (error) {
        response["error"] = error;
    }
    res.send(response);
});

app.listen(port, () => {
  console.log(`App listening at port ${port}`)
});