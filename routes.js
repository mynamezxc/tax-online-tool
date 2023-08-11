require('dotenv').config({ path: __dirname + '/../.env' });
var tax = require("./app/tax");
var api = require("./app/api");
// var bhxh = require("./app/bhxh");

module.exports = function (app) {

    // Tax APIs
    app.post("/api/token/changePassword", async (req, res) => {
        // Trigger change password from localhost:3000 Signer api
        var response = await api.change_token_password(req, res);
        res.send(response);
    });

    // Tax online
    // Open browser
	app.get("/:browser_id", async (req, res) => {
        var response = await tax.init_browser(req, res);
        res.send(response);
    });

    // Login
    app.get('/login/:browser_id/:captcha/:username/:password', async (req, res) => {
        var response = await tax.init_login(req, res);
        res.send(response);
	});

    // User info
    app.get('/user-info/:browser_id', async (req, res) => {
        var response = await tax.user_info(req, res);
        res.send(response);
	});
    app.get('/tax-info/:browser_id', async (req, res) => {
        var response = await tax.get_account_tax_information(req, res);
        res.send(response);
    });

    // Search
    app.get(["/search-document/:browser_id/:from_date/:to_date/:transaction_id", "/search-document/:browser_id/:from_date/:to_date"], async (req, res) => {
        var response = await tax.search_document(req, res);
        res.send(response);
	});
    app.get("/search-document-result/:browser_id/:transaction_id", async (req, res) => {
        var response = await tax.search_document_result(req, res);
        res.send(response);
    });


    // Uploads
    app.post("/upload-file/:browser_id", async (req, res) => {
        var response = await tax.upload_file(req, res);
        res.send(response);
    });
    app.post("/upload-attachment/:browser_id", async (req, res) => {
        var response = await tax.upload_attachment(req, res);
        res.send(response);
    });

    // Close
    app.get("/close-browser/:browser_id", async (req, res) => {
        var response = await tax.close_browser(req, res);
        res.send(response);
    });

}