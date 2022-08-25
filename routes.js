require('dotenv').config({ path: __dirname + '/../.env' });
var tool = require("./app/tool");

module.exports = function (app) {

    // Open browser
	app.get("/:browser_id", async (req, res) => {
        var response = await tool.init_browser(req, res);
        res.send(response);
    });

    // Login
    app.get('/login/:browser_id/:captcha/:username/:password', async (req, res) => {
        var response = await tool.init_login(req, res);
        res.send(response);
	});

    // User info
    app.get('/user-info/:browser_id', async (req, res) => {
        var response = await tool.user_info(req, res);
        res.send(response);
	});

    // Search
    app.get(["/search-document/:browser_id/:from_date/:to_date/:transaction_id", "/search-document/:browser_id/:from_date/:to_date"], async (req, res) => {
        var response = await tool.search_document(req, res);
        res.send(response);
	});
    app.get("/search-document-result/:browser_id/:transaction_id", async (req, res) => {
        var response = await tool.search_document_result(req, res);
        res.send(response);
    });


    // Uploads
    app.post("/upload-file/:browser_id", async (req, res) => {
        var response = await tool.upload_file(req, res);
        res.send(response);
    });
    app.post("/upload-attachment/:browser_id", async (req, res) => {
        var response = await tool.upload_attachment(req, res);
        res.send(response);
    });

    // Close
    app.get("/close-browser/:browser_id", async (req, res) => {
        var response = await tool.close_browser(req, res);
        res.send(response);
    });

}