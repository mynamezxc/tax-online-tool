/*
    Maintainer: Mynamezxc
    Email: nguyennh.ts24@gmail.com
    Version: v1.1
    Date: 09-10-2020
    Copyright TS24 2020
    Website: https://web.ts24.com.vn/
*/
// Chromium path
// D:\node_modules\puppeteer\.local-chromium\win64-800071\chrome-win
// Form upload iframe
// https://thuedientu.gdt.gov.vn/etaxnnt/Request?&dse_sessionId=37o3Cd_RrtQpKRGGnyZUO49&dse_applicationId=-1&dse_pageId=9&dse_operationName=uploadTaxOnlineProc&dse_processorState=initial&dse_nextEventName=start
// Status NopToKhai in javascript
// https://thuedientu.gdt.gov.vn/etaxnnt/static/script/chrome/page.js
// Form upload attach
// https://thuedientu.gdt.gov.vn/etaxnnt/Request?dse_sessionId="+session+"&dse_applicationId=-1&dse_operationName=traCuuToKhaiProc&dse_pageId=18&dse_processorState=viewTraCuuTkhai&dse_nextEventName=gui_phu_luc&tkhaiID="+transaction_id
const eSginer_path = __dirname + "/eSigner";
const key = "e8e3fa20d2588dfb1d1281caaf94332c";
const puppeteer = require('puppeteer');
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const parseJson = require('parse-json');
const fs = require('fs');
const app = express();
const port = 3000;
const path = require('path');
const base64 = require('base-64');
const utf8 = require('utf8');

app.use(express.static('public'));
app.use(bodyParser.json({limit: '50mb', extended: true}))
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}))
app.use(bodyParser.text({limit: '50mb', type: 'text/plain'}));
app.set('view engine', 'ejs');

const browser_options = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--load-extension='+eSginer_path,
    '--disable-extensions-except='+eSginer_path,
    // '--proxy-server='+proxy,
    "--disable-infobars",
    "--window-size=100,130",
    "--disable-infobars",
    "--window-position=99999,0"
]
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
            args: browser_options, headless: false, Devtools: false
        }
    );
    try {
        let pages = await browser.pages();
        var page = pages[0];
        if (pages.length == 2) {
            page = pages[1];
        }
        let url = "https://thuedientu.gdt.gov.vn"
        await page.setViewport({ width: 1366, height: 768});
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:81.0) Gecko/20100101 Firefox/81.0');
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
    
    // let script = `
    //     $("#_userName").val("${username}");
    //     $("#password").val("${password}");
    //     $("#vcode").val("${captcha}");
    //     $("#loginForm").submit();
    // `;
    // await page.addScriptTag({"content": script});
    await page.evaluate((username, password, captcha) => {
        document.querySelector('#_userName').value = username;
        document.querySelector('#password').value = password;
        document.querySelector('#vcode').value = captcha;
        document.querySelector('#dangnhap').click();
        // $("#loginForm").submit();
    }, username, password, captcha);
    
    // await page.waitForNavigation();
    await delay(3000);
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
            if(path.basename(filename).split("-").length != 5) {
                return false;
            }
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
    var real_path = __dirname.replace("\\", "/") + "/upload/" + real_name;
    
    // let script = `
    //     $("#fullPathFileName").val('${real_path}');
    //     $("#tkhaiFormat").val("9");
    //     $("#fileName").val("${real_name}");
    //     $("#fullPathFileName").val('${real_path}');
    //     $("#tkhaiFormat").val("9");
    //     $("#fileName").val("${real_name}");
    //     setTimeout(function() {
    //         checkSelectFileUpload();
    //         // uploadFile();
    //     }, 1000);
    // `;
    // await newPage.addScriptTag({"content": script});
    try {
        var content = "";
        var format = 0;
        var ext = path.extname(real_name);
        if(ext == ".xls") {
            format = 5;
        } else if(ext == ".xlsx") {
            format = 6;
        }  else if(ext == ".doc") {
            format = 7;
        } else if(ext == ".docx") {
            format = 8;
        } else if(ext == ".xml") {
            format = 9;
        } else if(ext == ".pdf") {
            format = 1;
        } else {
            return false;
        }
        if(format != 9) {
            return false;
        }
        await newPage.evaluate((format, real_path, real_name) => {
            document.querySelector('#fullPathFileName').value = real_path;
            document.querySelector('#tkhaiFormat').value = format;
            document.querySelector('#fileName').value = real_name;
            document.querySelector('#uploadButton').click();
        }, format, real_path, real_name);
        await delay(5000);
        content = await newPage.content();
        try {
            fs.unlink("./upload/"+real_name, (err) => {
                if (err) {
                    console.log("failed to delete local file:"+err);
                } else {
                    console.log('successfully deleted local file');                               
                }
            });
            const data = await newPage.evaluate(() => {
                const tds = Array.from(document.querySelectorAll('.tbl_member table tr td'))
                return tds.map(td => td.innerText)
            });
            if(data[1]) {
                console.log("Transaction no " + data[1].trim());
                await newPage.close();
                return data[1];
            }
        } catch(err) {
            await newPage.close();
            return false;
        }
    } catch(err) {
        await newPage.close();
    }
    return false;
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
    browsers[browser_id] = "1";
    var browser = await createBrowser(browser_id);
    console.log("Browser generated with id " + browser_id);
    if (browser) {
        browsers[browser_id] = browser;
        res.send({"id": browser_id, "status": true, "message":  "Waiting for captcha", "image": "captcha/"+browser_id+".png"});
    } else {
        delete browsers[browser_id];
        res.send({"id": browser_id, "status": false, "message": "Connection error"});
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
        res.send({"id": browser_id, "status": false, "message": "Missing parameters or browser busy", "image": "captcha/"+browser_id+".png"});
    }
});

app.post('/upload-file/:browser_id', async (req, res) => {
    if(req.query.key != key) {
        res.send({"status": false, "message": "Key error"});
        return;
    }
    var browser_id = req.params.browser_id
    console.log(req.body);
    var datas = parseJson(req.body);
    if(datas["file"] && datas["file_name"]) {
        var file_name = "./upload/" + datas["file_name"];
        fs.writeFileSync(file_name, utf8.decode(base64.decode(datas["file"])));
    } else {
        res.send({"id": browser_id, "status": false, "message": "Missing parameter file or file_content"});
        return;
    }
    var error = "";
    if (browsers[browser_id]) {
        var transaction = await eSigner(browser_id, file_name);
        if(transaction) {
            res.send({"id": browser_id, "status": true, "message": "Upload success", "transaction_id": transaction});
            return;
        } else {
            res.send({"id": browser_id, "status": false, "message": "Content or filename is not support with this account, ext .xml and syntax required"});
            return;
        }
    } else {
        error = "Browser ID does not exists or died";
    }

    if (error != "") {
        res.send({"id": browser_id, "status": false, "message": error});
    } else {
        res.send({"id": browser_id, "status": true, "message": "Upload success"});
    }
});

app.post("/upload-attachment/:browser_id", async (req, res) => {
    var browser_id = req.params.browser_id;
    var response = {"status": false, "browser_id": browser_id, "message": "Message sent to desktop"}
    if(req.query.key != key) {
        res.send({"status": false, "message": "Key error"});
        return;
    }
    // && browsers[browser_id]
    var datas = parseJson(req.body);
    if(browser_id && browsers[browser_id] && datas["file"] && datas["file_name"] && datas["transaction_id"] && datas["attachment_code"]) {
        var transaction_id = datas["transaction_id"];
        var attachment_code = datas["attachment_code"];
        if(datas["file"] && datas["file_name"]) {
            var file_name = "./upload/" + datas["file_name"];
            fs.writeFileSync(file_name, base64.decode(datas["file"]), 'binary');
        } else {
            res.send({"id": browser_id, "status": false, "message": "Missing parameter file or file_content"});
            return;
        }
        var pages = await browsers[browser_id].pages();
        var page = pages[0];
        if (pages.length == 2) {
            page = pages[1];
        }

        var session = await getSession(page);
        var url = "https://thuedientu.gdt.gov.vn/etaxnnt/Request?dse_sessionId="+session+"&dse_applicationId=-1&dse_operationName=traCuuToKhaiProc&dse_pageId=18&dse_processorState=viewTraCuuTkhai&dse_nextEventName=gui_phu_luc&tkhaiID="+transaction_id;
        let newPage = await browsers[browser_id].newPage();
        await newPage.setViewport({ width: 1366, height: 768});
        await newPage.goto(url);

        var real_name = path.basename(file_name);
        var real_path = __dirname.replace("\\", "/") + "/upload/" + real_name;
        var ext = path.extname(real_name);
        
        if(ext == ".xls") {
            format = 5;
        } else if(ext == ".xlsx") {
            format = 6;
        }  else if(ext == ".doc") {
            format = 7;
        } else if(ext == ".docx") {
            format = 8;
        } else if(ext == ".pdf") {
            format = 1;
        } else {
            response["status"] = false;
            response["message"] = "This file is not support, XML PDF WORD EXCEL required";
            res.send(response);
            return;
        }
        await newPage.evaluate((attachment_code, format, real_name, real_path) => {
            document.querySelector('#maPl').value = attachment_code;
            document.querySelector('#fullPathFileName').value = real_path;
            document.querySelector('#tkhaiFormat').value = format;
            document.querySelector('#fileName').value = real_name;
            document.querySelector('#uploadButton').click();
        }, attachment_code, format, real_name, real_path);
        await delay(4000);
        var message = await newPage.evaluate(() => {
            if(document.querySelector(".app_error")) {
                return document.querySelector(".app_error").textContent.replace("\n", "").replace("\\n", "").trim();
            }
            return false;
        });
        fs.unlink("./upload/"+real_name, (err) => {
            if (err) {
                console.log("failed to delete local file:"+err);
            } else {
                console.log('successfully deleted local file');                               
            }
        });
        if(message) {
            response["status"] = false;
            response["message"] = message;
            await newPage.close();
        } else {
            try {
                const data = await newPage.evaluate(() => {
                    const tds = Array.from(document.querySelectorAll('table tr td'))
                    return tds.map(td => td.innerText)
                });
                await newPage.close();
                if(data.length >= 1) {
                    response["status"] = true;
                    response["message"] = "Upload success";
                    res.send(response);
                    return;
                }
            } catch(err) {
                await newPage.close();
                res.send(response);
                return false;
            }
            res.send(response);
        }
    } else {
        response["status"] = false;
        response["message"] = "Missing parameter or browser does not exists";
    }
    
    res.send(response);
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