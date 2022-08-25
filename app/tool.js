// Vui lòng nhấn nút "Trở lại" để về trang chủ
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
const eSginer_path = __dirname + "/../eSigner";
const key = "e8e3fa20d2588dfb1d1281caaf94332c";
const puppeteer = require('puppeteer');

const express = require('express');
const bodyParser = require('body-parser');
const parseJson = require('parse-json');
const fs = require('fs');
const app = express();
const port = 3999;
const path = require('path');
const base64 = require('base-64');
const utf8 = require('utf8');
var $ = require( "jquery" );

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
    "--disable-infobars",
    "--window-size=1200,900",
    "--disable-infobars",
    // "--window-position=99999,0"
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

async function is_expired(browser, session) {
    var url = "https://thuedientu.gdt.gov.vn/etaxnnt/Request?&dse_sessionId="+session+"&dse_applicationId=-1&dse_pageId=8&dse_operationName=corpUserInfoManageProc&dse_processorState=initial&dse_nextEventName=start#!";
    let pages = await browser.pages();
    let page = pages[0];
    if (pages.length == 2) {
        page = pages[1];
    }
    var newPage = await browser.newPage();
    const downloadPath = path.resolve(__dirname.replace("\\", "/") + '/../public/files');
    await newPage._client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: downloadPath 
    });
    await newPage.setViewport({ width: 1366, height: 768});
    await newPage.goto(url);

    // await delay(3000);
    content = await newPage.content();
    if (content.search("Phiên giao dịch hết hạn") != -1 || content.search("Error 500: java.lang.NullPointerException") != -1) {
        return true
    }
    await newPage.close();
    return false
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
        
        content = await page.content();
        if (content.search("Mã xác nhận") != -1) {
            await page.screenshot({path: __dirname.replace("\\", "/")+"/../public/captcha/"+id+'.png', clip:{x: 944, y: 198, width: 74, height: 35}});
        }
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
    
    await page.waitForNavigation();
    await delay(3000);
    let content = await page.content();
    if(content.search("btn_logout.gif") != -1 || content.search("Hệ thống đang thực hiện kiểm tra bản cập nhật. Vui lòng chờ trong giây lát") != -1) {
        return true;
    } else {
        console.log(__dirname.replace("\\", "/")+"/../public/captcha/"+browser_id+'.png');
        await page.screenshot({path: __dirname.replace("\\", "/")+"/../public/captcha/"+browser_id+'.png', clip:{x: 944, y: 198, width: 74, height: 35}});
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
    var real_path = __dirname.replace("\\", "/") + "/../upload/" + real_name;
    
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

var init_browser = async (req, res) => {
    // Open Browser
    var browser_timeout = 600000 * 6; // 600 seconds
    var browser_id = req.params.browser_id;
    if(req.query.key != key) {
        return {"status": false, "message": "Key error"};
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
    // Auto close browser after $browser_timeout/1000 seconds
    setTimeout(() => {
        closeBrowser(browsers[browser_id]);
    }, browser_timeout);
    console.log("Browser generated with id " + browser_id);
    if (browser) {
        browsers[browser_id] = browser;
        var dt = new Date();
        dt.setMinutes( dt.getMinutes() + (browser_timeout / 1000 / 60) );
        var close_time = [
            dt.getDate(),
            dt.getMonth()+1,
            dt.getFullYear()].join('/')+' '+
           [dt.getHours(),
            dt.getMinutes(),
            dt.getSeconds()].join(':');
        
        try {
            var image = "captcha/"+browser_id+".png";
            if (!fs.existsSync(__dirname.replace("\\\\", "/") +"/../public/"+image)) {
                image = "";
            }
        } catch(err) {
            image = "";
        }
        return {"id": browser_id, "status": true, "message":  "Waiting for captcha", "image": image, "browser_close_time": close_time};
    } else {
        delete browsers[browser_id];
        return {"id": browser_id, "status": false, "message": "Connection error"};
    }
}

var init_login = async (req, res) => {

    if(req.query.key != key) {
        return {"status": false, "message": "Key error"};
    }
    
    var browser_id = req.params.browser_id
    var captcha = req.params.captcha
    var username = req.params.username;
    var password = req.params.password;
    
    if (browsers[browser_id] && captcha != "" && username != "" && password != "") {
        var logined = await fillCaptchaAndLogin(browser_id, captcha, username, password);
        if (!logined) {
            return {"id": browser_id, "status": false, "message": "Captcha, username or password was wrong. Please try again", "image": "captcha/"+browser_id+".png"};
        } else {
            fs.unlink(__dirname.replace("\\\\", "/") + "/../public/captcha/"+browser_id+".png", (err) => {
                if (err) {
                    console.log("failed to delete local image:"+err);
                } else {
                    console.log('successfully deleted local image');                               
                }
            });
            var user_detail = await user_info(req, res);
            if (user_detail && user_detail["status"] && user_detail["results"].length >= 1 && user_detail["results"]["detail"]) {
                user_detail = user_detail["results"]["detail"];
            } else {
                return user_detail;
            }
            return {"id": browser_id, "status": true, "message": "Login success", "user_info": user_detail};
        }
    } else {
        return {"id": browser_id, "status": false, "message": "Missing parameters or browser busy", "image": "captcha/"+browser_id+".png"};
    }
};

var search_document = async (req, res) => {
    if(req.query.key != key) {
        return {"status": false, "message": "Key error"};
    }

    var browser_id = req.params.browser_id;
    var from_date = req.params.from_date;
    var to_date = req.params.to_date;
    var transaction_id = "";
    if ("transaction_id" in req.params) {
        transaction_id = req.params.transaction_id;
    }

    if (browsers[browser_id]) {


        let pages = await browsers[browser_id].pages();
        let page = pages[0];
        if (pages.length == 2) {
            page = pages[1];
        }
        var session = await getSession(page);
        var session_expired = await is_expired(browsers[browser_id], session);
        if (session_expired) {
    
            // Get captcha and return
    
            var browser_timeout = 600000 * 6; // 600 seconds
            var browser_id = req.params.browser_id;
            if(req.query.key != key) {
                return {"status": false, "message": "Key error"};
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
            // Auto close browser after $browser_timeout/1000 seconds
            setTimeout(() => {
                closeBrowser(browsers[browser_id]);
            }, browser_timeout);
            console.log("Browser generated with id " + browser_id);
            if (browser) {
                browsers[browser_id] = browser;
                var dt = new Date();
                dt.setMinutes( dt.getMinutes() + (browser_timeout / 1000 / 60) );
                var close_time = [
                    dt.getDate(),
                    dt.getMonth()+1,
                    dt.getFullYear()].join('/')+' '+
                [dt.getHours(),
                    dt.getMinutes(),
                    dt.getSeconds()].join(':');
                
                try {
                    var image = "captcha/"+browser_id+".png";
                    if (!fs.existsSync(__dirname.replace("\\\\", "/") + "/../public/"+image)) {
                        image = "";
                    }
                } catch(err) {
                    image = "";
                }
                captcha_obj = {"id": browser_id, "status": true, "message":  "Waiting for captcha", "image": image, "browser_close_time": close_time};
                return {
                    "id": browser_id,
                    "status": false,
                    "message": "Session Expired",
                    "results": [],
                    "captcha": captcha_obj
                };
            } else {
                delete browsers[browser_id];
                return {"id": browser_id, "status": false, "message": "Connection error"};
            }
    
    
        } else {

            var url = "https://thuedientu.gdt.gov.vn/etaxnnt/Request?&dse_sessionId="+session+"&dse_applicationId=-1&dse_pageId=8&dse_operationName=traCuuToKhaiProc&dse_processorState=initial&dse_nextEventName=start#!"
            var newPage = await browsers[browser_id].newPage();
            const downloadPath = path.resolve(__dirname.replace("\\", "/") + '/../public/files');
            await newPage._client.send('Page.setDownloadBehavior', {
                behavior: 'allow',
                downloadPath: downloadPath 
            });
            await newPage.setViewport({ width: 1366, height: 768});
            await newPage.goto(url);

            await newPage.evaluate((from_date, to_date, transaction_id) => {
                document.querySelector('#qryFromDate').value = from_date;
                document.querySelector('#qryToDate').value = to_date;
                if(typeof(transaction_id) != "undefined" && transaction_id.length >= 1) {
                    document.querySelector('#ma_gd').value = transaction_id;
                }
                // document.querySelector('#uploadButton').click();
                validateForm();
            }, from_date, to_date, transaction_id);

            await delay(3000);
            content = await newPage.content();
            
            // var search_results = [];
            let datas = await newPage.evaluate(async () => {
                var response_searchs = [];
                $("#allResultTableBody tr").each(async function(key, el) {
                    var td_list = $(el).find("td");
                    if(td_list.length >= 1) {
                        var id = $(td_list[1]).text().trim();
                        
                        if (Number.isInteger(parseInt(id))) {
                            
                            response_searchs.push({
                                processorId: $("input[name='dse_processorId']").val(),
                                id: id,
                                document_type: $(td_list[2]).text().trim().split("-")[0],
                                document_name: $(td_list[2]).text().trim(),
                                period: $(td_list[3]).text().trim(),
                                type_of_document: $(td_list[4]).text().trim(),
                                submitted_times: $(td_list[5]).text().trim(),
                                additional_times: $(td_list[6]).text().trim(),
                                submitted_date: $(td_list[7]).text().trim(),
                                submitted_organ: $(td_list[9]).text().trim(),
                                status: $(td_list[10]).text().trim()
                            })
                            console.log(id);
                        }
                        
                    }
                });
                return response_searchs;
            });

            console.log("LIST OF FILE: ");
            console.log(datas);
            console.log("--------------------------------------------------------");

            var tabs = [];
            for (var i = 0; i < datas.length; i++) {
                let url = "https://thuedientu.gdt.gov.vn/etaxnnt/Request?dse_sessionId="+session+"&dse_applicationId=-1&dse_operationName=traCuuToKhaiProc&dse_pageId=9&dse_processorState=viewTraCuuTkhai&dse_processorId="+datas[i]["processorId"]+"&dse_nextEventName=downTkhai&messageId="+datas[i]["id"];
                tabs[i] = await browsers[browser_id].newPage();
                const downloadPath = path.resolve(__dirname.replace("\\\\", "/") + '/../public/files/');
                await tabs[i]._client.send('Page.setDownloadBehavior', {
                    behavior: 'allow',
                    downloadPath: downloadPath 
                });
                await tabs[i].setViewport({ width: 1366, height: 768});

                // Get file to khai
                await newPage.evaluate(async (file_id) => {
                    if (Number.isInteger(parseInt(file_id))) {
                        await downloadTkhai(file_id);
                    }
                }, datas[i]["id"]);
                await delay(500);
                if (fs.existsSync(downloadPath + "/ETAX"+ datas[i]["id"] + ".xml")) {
                    datas[i]["file"] = fs.readFileSync(downloadPath + "/ETAX"+ datas[i]["id"] + ".xml", {encoding: 'base64'});
                    fs.unlinkSync(downloadPath + "/ETAX"+ datas[i]["id"] + ".xml");
                }
                // Close
                delete datas[i]["processorId"];
                await tabs[i].close();
                
            }
            // return {"id": browser_id, "status": false, "message": "Has an error occurred", "results": []};
            await newPage.close();
            return {"id": browser_id, "status": true, "message": "Search success", "results": datas};

        }
    } else {
        return {"status": false, "message": "Browser does not exists"};
    }

};

var user_info = async (req, res) => {

    if(req.query.key != key) {
        return {"status": false, "message": "Key error"};
    }
    var datas = [];
    var browser_id = req.params.browser_id;
    if (browsers[browser_id]) {
        var browser = browsers[browser_id];
        let pages = await browser.pages();
        let page = pages[0];
        if (pages.length == 2) {
            page = pages[1];
        }
        var session = await getSession(page);
        var url = "https://thuedientu.gdt.gov.vn/etaxnnt/Request?&dse_sessionId="+session+"&dse_applicationId=-1&dse_pageId=8&dse_operationName=corpUserInfoManageProc&dse_processorState=initial&dse_nextEventName=start#!";
        var newPage = await browser.newPage();
        const downloadPath = path.resolve(__dirname.replace("\\", "/") + '/../public/files');
        await newPage._client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadPath 
        });
        await newPage.setViewport({ width: 1366, height: 768});
        await newPage.goto(url);

        // await delay(3000);
        content = await newPage.content();
        if (content.search("Phiên giao dịch hết hạn") != -1 || content.search("Error 500: java.lang.NullPointerException") != -1) {
            // Get captcha and return
        
            var browser_timeout = 600000 * 6; // 600 seconds
            var browser_id = req.params.browser_id;
            if(req.query.key != key) {
                return {"status": false, "message": "Key error"};
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
            // Auto close browser after $browser_timeout/1000 seconds
            setTimeout(() => {
                closeBrowser(browsers[browser_id]);
            }, browser_timeout);
            console.log("Browser generated with id " + browser_id);
            if (browser) {
                browsers[browser_id] = browser;
                var dt = new Date();
                dt.setMinutes( dt.getMinutes() + (browser_timeout / 1000 / 60) );
                var close_time = [
                    dt.getDate(),
                    dt.getMonth()+1,
                    dt.getFullYear()].join('/')+' '+
                [dt.getHours(),
                    dt.getMinutes(),
                    dt.getSeconds()].join(':');
                
                try {
                    var image = "captcha/"+browser_id+".png";
                    if (!fs.existsSync(__dirname.replace("\\\\", "/") + "/../public/"+image)) {
                        image = "";
                    }
                } catch(err) {
                    image = "";
                }
                captcha_obj = {"id": browser_id, "status": true, "message":  "Waiting for captcha", "image": image, "browser_close_time": close_time};
                return {
                    "id": browser_id,
                    "status": false,
                    "message": "Session Expired",
                    "results": [],
                    "captcha": captcha_obj
                };
            } else {
                delete browsers[browser_id];
                return {"id": browser_id, "status": false, "message": "Connection error"};
            }
        } else {
            datas = await newPage.evaluate(async () => {
                var response_searchs = {"detail": [], "banks": []};
                $("table.result_table tr").each(async function(key, el) {
                    var td_list = $(el).find("td");
                    if(td_list.length == 2) {
                        switch(key) {
                            case 0:
                                key_name = "username";
                                break;
                            case 1:
                                key_name = "fullname";
                                break;
                            case 2:
                                key_name = "phone";
                                break;
                            case 3:
                                key_name = "email";
                                break;
                            case 4:
                                key_name = "cccd";
                                break;
                            case 5:
                                key_name = "department";
                                break;
                            default:
                                key_name = $(td_list[0]).text().trim();

                        }
                        console.log(key_name);
                        console.log("-------------");
                        response_searchs["detail"].push({
                            key_name: key_name,
                            key_value: $(td_list[1]).text().trim(),
                        })
                    } else if(td_list.length == 4) {
                        if ($(td_list[0]).text().trim() != "STT") {
                            response_searchs["banks"].push({
                                "bank_name": $(td_list[1]).text().trim(),
                                "bank_account": $(td_list[2]).text().trim(),
                                "currency": $(td_list[3]).text().trim()
                            });
                        }
                        
                    }
                });
                return response_searchs;
            });
            await newPage.close();
        }
        return {"id": browser_id, "status": true, "message": "success", "results": datas};
    } else {
        return {"status": false, "message": "Browser does not exists"};
    }

};

// Lấy thông báo theo id document
var search_document_result =  async (req, res) => {

    if(req.query.key != key) {
        return {"status": false, "message": "Key error"};
    }
    var datas = [];
    var browser_id = req.params.browser_id;
    // var from_date = req.params.from_date;
    // var to_date = req.params.to_date;
    var transaction_id = "";
    if ("transaction_id" in req.params) {
        transaction_id = req.params.transaction_id;
    }

    if (browsers[browser_id]) {
        let pages = await browsers[browser_id].pages();
        let page = pages[0];
        if (pages.length == 2) {
            page = pages[1];
        }
        var session = await getSession(page);
        var session_expired = await is_expired(browsers[browser_id], session);
        if (session_expired) {
    
            // Get captcha and return
    
            var browser_timeout = 600000 * 6; // 600 seconds
            var browser_id = req.params.browser_id;
            if(req.query.key != key) {
                return {"status": false, "message": "Key error"};
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
            // Auto close browser after $browser_timeout/1000 seconds
            setTimeout(() => {
                closeBrowser(browsers[browser_id]);
            }, browser_timeout);
            console.log("Browser generated with id " + browser_id);
            if (browser) {
                browsers[browser_id] = browser;
                var dt = new Date();
                dt.setMinutes( dt.getMinutes() + (browser_timeout / 1000 / 60) );
                var close_time = [
                    dt.getDate(),
                    dt.getMonth()+1,
                    dt.getFullYear()].join('/')+' '+
                [dt.getHours(),
                    dt.getMinutes(),
                    dt.getSeconds()].join(':');
                
                try {
                    var image = "captcha/"+browser_id+".png";
                    if (!fs.existsSync(__dirname.replace("\\\\", "/") + "/../public/"+image)) {
                        image = "";
                    }
                } catch(err) {
                    image = "";
                }
                captcha_obj = {"id": browser_id, "status": true, "message":  "Waiting for captcha", "image": image, "browser_close_time": close_time};
                return {
                    "id": browser_id,
                    "status": false,
                    "message": "Session Expired",
                    "results": [],
                    "captcha": captcha_obj
                };
            } else {
                delete browsers[browser_id];
                return {"id": browser_id, "status": false, "message": "Connection error"};
            }
    
        }
        else
        {
    
            let pages = await browsers[browser_id].pages();
            let page = pages[0];
            if (pages.length == 2) {
                page = pages[1];
            }
            var url = "https://thuedientu.gdt.gov.vn/etaxnnt/Request?&dse_sessionId="+session+"&dse_applicationId=-1&dse_pageId=6&dse_operationName=traCuuTbaoTkhaiProc&dse_processorState=initial&dse_nextEventName=start#!";
            var newPage = await browsers[browser_id].newPage();
            const downloadPath = path.resolve(__dirname.replace("\\", "/") + '/../public/files');
            await newPage._client.send('Page.setDownloadBehavior', {
                behavior: 'allow',
                downloadPath: downloadPath 
            });
            await newPage.setViewport({ width: 1366, height: 768});
            console.log(url);
            await newPage.goto(url);
    
            await newPage.evaluate((transaction_id) => {
                if(typeof(transaction_id) != "undefined" && transaction_id.length >= 1) {
                    document.querySelector('#ma_gd').value = transaction_id;
                }
                validateForm();
            }, transaction_id);
    
            await delay(1000);
            content = await newPage.content();
    
            datas = await newPage.evaluate(async () => {
                var response_searchs = [];
                $("#allResultTableBody tr").each(async function(key, el) {
                    var td_list = $(el).find("td");
                    if(td_list.length >= 1) {
                        var file_id = "";
                        var result_id_code = $(td_list[1]).text().trim();
    
                        var html_submit = $(td_list[5]).html().trim();
                        var matches = html_submit.match(/downloadFile\('([a-zA-Z0-9-_.]+)'\);/);
                        if (matches.length >= 2) {
                            id = matches[1];
                        }
                        if (Number.isInteger(parseInt(id))) {
                            file_id = id;
                        }
                        
                        response_searchs.push({
                            result_code: result_id_code,
                            transaction_id: $(td_list[2]).text().trim(),
                            result_name: $(td_list[3]).text().trim(),
                            send_date: $(td_list[4]).text().trim(),
                            file_id: file_id
                        })
                    }
                });
                return response_searchs;
            });
    
            for (let file of datas) {
                await newPage.evaluate(async (file_id) => {
                    if (Number.isInteger(parseInt(file_id))) {
                        await downloadFile(file_id);
                    }
                }, file["file_id"]);
                await delay(300);
            }
            // await delay(5000);
            for (var x = 0; x < datas.length; x++) {
                datas[x]["file"] = "";
                if (datas[x]["file_id"]) {
                    if (fs.existsSync(downloadPath + "/ETAX"+ datas[x]["file_id"] + ".xml")) {
                        datas[x]["file"] = fs.readFileSync(downloadPath + "/ETAX"+ datas[x]["file_id"] + ".xml", {encoding: 'base64'});
                        fs.unlinkSync(downloadPath + "/ETAX"+ datas[x]["file_id"] + ".xml");
                    }
                }
                
            }
            await newPage.close();
            return {"id": browser_id, "status": true, "message": "Search success", "results": datas};
        }
    } else {
        return {"status": false, "message": "Browser does not exists"};
    }
    

};

var upload_file =  async (req, res) => {
    if(req.query.key != key) {
        return {"status": false, "message": "Key error"};
    }
    var browser_id = req.params.browser_id
    console.log(req.body);
    var datas = parseJson(req.body);
    if(datas["file"] && datas["file_name"]) {
        var file_name = "./upload/" + datas["file_name"];
        fs.writeFileSync(file_name, utf8.decode(base64.decode(datas["file"])));
    } else {
        return {"id": browser_id, "status": false, "message": "Missing parameter file or file_content"};
    }
    var error = "";
    if (browsers[browser_id]) {
        var transaction = await eSigner(browser_id, file_name);
        if(transaction) {
            return {"id": browser_id, "status": true, "message": "Upload success", "transaction_id": transaction};
        } else {
            return {"id": browser_id, "status": false, "message": "Content or filename is not support with this account, ext .xml and syntax required"};
        }
    } else {
        error = "Browser does not exists";
    }

    if (error != "") {
        return {"id": browser_id, "status": false, "message": error};
    } else {
        return {"id": browser_id, "status": true, "message": "Upload success"};
    }
};

var upload_attachment = async (req, res) => {
    var browser_id = req.params.browser_id;
    var response = {"status": false, "browser_id": browser_id, "message": "Message sent to desktop"}
    if(req.query.key != key) {
        return {"status": false, "message": "Key error"};
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
            return {"id": browser_id, "status": false, "message": "Missing parameter file or file_content"};
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
        var real_path = __dirname.replace("\\", "/") + "/../upload/" + real_name;
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
            return response;
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
                    return response;
                }
            } catch(err) {
                await newPage.close();
                return response;
            }
            return response;
        }
    } else {
        response["status"] = false;
        response["message"] = "Missing parameter or browser does not exists";
    }
    
    return response;
};

var close_browser = async (req, res) => {
    var browser_id = req.params.browser_id;
    if(req.query.key != key) {
        return {"status": false, "message": "Key error"};
    }
    var response = {"status": true, "message":"closed"}
    try {
        await closeBrowser(browsers[browser_id]);
        delete browsers[browser_id];
    } catch (error) {
        response["error"] = error;
    }
    return response;
};


module.exports = {init_browser, init_login, user_info, search_document, search_document_result, close_browser, upload_attachment, upload_file}