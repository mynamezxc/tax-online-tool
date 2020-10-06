var _eid_promises = {};
var port = null;
function onNativeMessage(message) {
	appendMessage("Received message: <b>" + JSON.stringify(message) + "</b>");
	var p = _eid_promises[message.CODE];
}
function onDisconnected() {
	port = null;
}
function processOperation(data, sender, response) {
    try {
	    connect();
        port.postMessage( data );
        port.onMessage.addListener(response);
    }
    catch( e ) {
        console.log(e.message);
    }
    return true;
}
function connect() {
	var hostName = "esigner.chrome.tct.gdt.gov.vn";	
	if(!chrome.runtime) {
		chrome.runtime = chrome.extension;
	}
	port = chrome.runtime.connectNative(hostName);
	port.onDisconnect.addListener(function() {
		console.log("QUIT");
	});
}
document.addEventListener('DOMContentLoaded', function() {
	connect();
	document.getElementById('sign-button').addEventListener('click',chromeSigning);
});
function messagePromise(msg) {
	return new Promise(function(resolve, reject) {
		try{
			port.postMessage(msg);
			_eid_promises[msg.CODE] = {
				resolve: resolve,
				reject: reject
			};
		}catch(err){
			port = null;
		}		
	});
}
function _signCH(base64Value) {
	var msg = document.getElementById("txtInput").value;
	msg = jQuery.parseJSON(msg);
	return messagePromise(msg);
}
function chromeSigning() {	
	var base64Value = "";
	appendMessage("Send message: <b>" + base64Value + "</b>");
	if(!port) 
		connect();
	port.onMessage.addListener(onNativeMessage);
	_signCH(base64Value).then(function(response){
		if(response){
			appendMessage("SIGNED_CONTENT: <b>" + response.SIGNED_CONTENT + "</b>");
			appendMessage("CERT: <b>" + response.CERT + "</b>");
			appendMessage("PIN_CODE: <b>" + response.PIN_CODE + "</b>");
			appendMessage("CERT_CHAIN: <b>" + response.CERT_CHAIN + "</b>");
		}
	});
}
function appendMessage(text) {
	document.getElementById('response').innerHTML += "<p>" + text + "</p><br/>";
}