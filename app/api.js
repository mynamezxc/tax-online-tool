require('dotenv').config({ path: __dirname + '/.env' });
const signer_api_key = process.env.SIGNER_API_KEY;
const key = process.env.KEY;
const request = require('sync-request');

async function doRequest(url, body_data) {
    // return new Promise(function (resolve, reject) {
    //     request.post({
    //         uri: url,
    //         json:true,
    //         body: body_data
    //     }, function (error, response, body) {
    //         if (!error && response.statusCode == 200) {
    //             resolve(body);
    //         } else {
    //             reject(error);
    //         }
    //     })
        
    // });
    var res = await request('POST', url, {
        json: body_data,
    });
    var response = JSON.parse(res.getBody('utf8'));
    return response
}

var change_token_password = async (req, res) => {

    var tokenSerial = req.body.tokenSerial;
    var pin = req.body.pin;
    var new_pin = req.body.new_pin;
    if (!signer_api_key) {
        return {"status": false, "message": "Signer por 3000 key error"};
    }

    if (req.query.key != key) {
        return {"status": false, "message": "Key error"};
    }

    if (pin != "" && isNaN(pin) && pin.toString().length > 8 || pin.toString().length < 6) {
        return {"status": false, "message": "Pin length error"};
    }
    // new_pin length đã có js check

    var response = {"status": false, "message": "Unknown error"}

    // Request to Signer port 3000
    try {
        let url = "http://127.0.0.1:3000/api/token/changePassword"
        let json = {
            "pin": pin,
            "new_pin": new_pin,
            "api_key": signer_api_key,
            "tokenSerial": tokenSerial
        }
        let result = await doRequest(url, json);
        if (result !== undefined) {
            if (result.status == 1) {
                return response = {"status": false, "message": result.message}
            } else if (result.status == 0) {
                return response = {"status": true, "message": result.message}
            }
        }
    } catch (error) {
        response["message"] = error;
    }
    return response;
};

module.exports = {change_token_password}