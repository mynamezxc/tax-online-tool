var express = require("express");
var bodyParser = require("body-parser");
require('dotenv').config({ path: __dirname + '/.env' });

var app = express();
const port = process.env.APP_PORT;
app.use(express.static('public'));
app.use(bodyParser.json({limit: '50mb', extended: true}))
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}))
app.use(bodyParser.text({limit: '50mb', type: 'text/plain'}));

// app.use(bodyParser.json({limit: '1000mb'}));
// app.use(bodyParser.urlencoded({limit: '1000mb', extended: true, parameterLimit:5000000}));
app.use(bodyParser.json({limit:1024*1024*20000, type:'application/json'}));
app.use(bodyParser.urlencoded({extended:true,limit:1024*1024*20000,type:'application/x-www-form-urlencoding' }));

var isProduction = process.env.ENVIRONMENT === 'production'

require("./routes")(app);

app.listen(port, () => {
	console.log(`Safety signing listening at http://localhost:${port}`);
});