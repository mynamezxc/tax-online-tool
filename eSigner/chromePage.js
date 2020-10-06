var _eid_promises = {};
var port = null;
function onNativeMessage(message) {
	appendMessage("Received message: <b>" + JSON.stringify(message) + "</b>");	
	var p = _eid_promises[message.CODE];
	if(message.SIGNED_CONTENT !== undefined) {
		 p.resolve(message);
	} else {
		p.reject(new Error('error'));
	}
}
function onDisconnected() {
	port = null;
}
function connect() {
	var hostName = "esigner.chrome.tct.gdt.gov.vn";	
	port = chrome.runtime.connectNative(hostName);
	port.onMessage.addListener(onNativeMessage); 
	port.onDisconnect.addListener(onDisconnected);	
}
document.addEventListener('DOMContentLoaded', function() {
	connect();
	document.getElementById('sign-button').addEventListener('click', chromeSigning);
});
function messagePromise(msg) {
	return new Promise(function(resolve, reject) {
		port.postMessage(msg);
		_eid_promises[msg.CODE] = {
			resolve: resolve,
			reject: reject
		};
	});
}
function _signCH(base64Value) {
	var msg = {
			"CODE" : "001",
			"BASE64_VALUE" : base64Value
		};
	return messagePromise(msg);
}
function chromeSigning() {
	var base64Value = "";
	appendMessage("Send message: <b>" + base64Value + "</b>");
	if(!port) 
		connect();
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