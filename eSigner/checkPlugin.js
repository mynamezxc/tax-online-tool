var _eid_promises_chk = {};
var _eid_promises = {};
window.addEventListener("message", function(event) {
    if(event.source !== window) return;
    if(event.data.src && (event.data.src === "background.js")) {
        console.log("Page received: ");
        console.log(event.data);
        if(event.data.CODE) {
        	if(event.data.CODE=='CHECK'){
        		var p = _eid_promises_chk[event.data.CODE];
                if(p&&event.data.CODE) {
    				p.resolve(event.data);
                } else {
                    p.reject(new Error(event.data.CODE));
                }
                delete _eid_promises_chk[event.data.CODE];
        	}else{
        		var p = _eid_promises[event.data.CODE];
                if(p&&event.data.CODE) {
    				p.resolve(event.data);
                } else {
                }
                delete _eid_promises[event.data.CODE];
        	}
        } else {
            console.log("No nonce in event msg");
        }
    }
}, false);
var TCTCheckPlugin = function TCTCheckPlugin() {
    function nonce() {
        var val = "";
        var hex = "abcdefghijklmnopqrstuvwxyz0123456789";
        for(var i = 0; i < 16; i++) val += hex.charAt(Math.floor(Math.random() * hex.length));
        return val;
    }
    function messagePromise(msg) {
        return new Promise(function(resolve, reject) {
            msg['nonce'] = msg.CODE;
            msg['src'] = 'page.js';
            window.postMessage(msg, "*");
            _eid_promises_chk[msg.CODE] = {
                resolve: resolve,
                reject: reject
            };
        });
    }
	var fields = {};
    fields.getVersion = function(msg) {
        console.log("getVersion()");
        return messagePromise({
            type: 'CHECK',
			CODE: 'CHECK',
			ROOT_URL: msg.ROOT_URL
        });
    };
	return fields;
}();