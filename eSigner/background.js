var NO_NATIVE_URL = "#";
var HELLO_URL = "#";
var DEVELOPER_URL = "#";
var NATIVE_HOST = "esigner.chrome.tct.gdt.gov.vn";
var K_SRC = "src";
var K_ORIGIN = "origin";
var K_NONCE = "nonce";
var K_RESULT = "result";
var K_TAB = "tab";
var K_EXTENSION = "extension";
var K_CHECK = "check";
var K_CODE = "CODE";
var ports = {};
var missing = false;
console.log("Background page activated");
chrome.runtime.onStartup.addListener(function() {
	console.log("onStartuped");
});
function _killPort(tab) {
	if (tab in ports) {
		console.log("KILL " + tab);
		ports[tab].postMessage({});
	}
}
function _killPortDiffTab(tab) {
	if (!(tab in ports)) {
		var killport = ports[tab];
		if(killport){
			console.log("KILL " + tab);
			killport.disconnect();
			killport = null;
			delete ports[tab];
		}
	}
}
function _testNativeComponent(message) {
	return new Promise(function(resolve, reject) {
		chrome.runtime.sendNativeMessage(NATIVE_HOST, {CODE:"CHECK_VERSION", ROOT_URL: message.ROOT_URL}, function(response) {
			if (!response) {
				console.log("TEST: ERROR " + JSON.stringify(chrome.runtime.lastError));
				var permissions = "Access to the specified native messaging host is forbidden.";
				var missing = "Specified native messaging host not found.";
				if (chrome.runtime.lastError.message === permissions) {
					resolve("forbidden")
				} else if (chrome.runtime.lastError.message === missing) {
					resolve("missing");
				} else {
					resolve("missing");
				}
			} else {
				console.log("TEST: " + JSON.stringify(response));
				if (response["RESULT"] === "SUCC") {
					resolve(response);
				} else {
					resolve("missing");
				}
			}
		});
	});
}
chrome.runtime.onInstalled.addListener(function(details) {
	console.log("onInstalled");
	if (details.reason === "install" || details.reason === "update") {		
	}
});
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if(sender.id !== chrome.runtime.id) {
		console.log('WARNING: Ignoring message not from our extension');
		return;
	}
	if (sender.tab) {
		if (request["type"] === "DONE") {
			console.log("DONE " + sender.tab.id);
			if (sender.tab.id in ports) {
				_killPort(sender.tab.id);
			} 
		} 
		else {
			request[K_TAB] = sender.tab.id;
			if (missing)
				return _fail_with(request, "no_implementation");
			_forward(request);
		}
		
	}
});
function _reply(tab, msg) {
	msg[K_SRC] = "background.js";
	msg[K_EXTENSION] = chrome.app.getDetails().version;
	chrome.tabs.sendMessage(tab, msg);
}
function _fail_with(msg, result) {
	var resp = {};
	resp[K_NONCE] = msg[K_NONCE];
	resp[K_RESULT] = result;
	_reply(msg[K_TAB], resp);
}
function _checkPort(message){
	var tabid = message[K_TAB];
	if(message.type=='CHECK'){
		var resp = {};
		resp[K_NONCE] = message[K_NONCE];
		resp[K_CODE] = message[K_CODE];
		if(!ports[tabid]){
			var port = chrome.runtime.connectNative(NATIVE_HOST);
			if (!port) {
				resp[K_RESULT] = 'FAIL';
				resp['IS_UPDATE'] = 'N';
				_reply(tabid, resp);
			}else{
				port.onMessage.addListener(function(response) {
					if (response) {
						_reply(tabid, response);
					} else {
						_fail_with(message, "technical_error");
					}
				});
				port.onDisconnect.addListener(function() {
					delete ports[tabid];
				});
				ports[tabid] = port;					
				_testNativeComponent(message).then(function(result) {
					var url = null;
					var isok = result.RESULT;
					resp['IS_UPDATE'] = result.IS_UPDATE;
					if (isok === "SUCC") {
						resp[K_RESULT] = 'SUCC';						
						_reply(tabid, resp);
					} else if (result === "forbidden") {
						resp[K_RESULT] = 'FAIL';
						_reply(tabid, resp);
					} else if (result === "missing"){
						resp[K_RESULT] = 'FAIL';
						_reply(tabid, resp);
					}
				});
			}
		}else{
			resp[K_RESULT] = 'SUCC';
			resp['IS_UPDATE'] = 'N';
			_reply(tabid, resp);
		}

	}
}
function _forward(message) {
	var tabid = message[K_TAB];
	if(message!=null&&message.type=='CHECK'){
		_checkPort(message);
	}else{
		if(!ports[tabid]) {
			var port = chrome.runtime.connectNative(NATIVE_HOST);
			if (!port) {
				console.log("OPEN ERROR: " + JSON.stringify(chrome.runtime.lastError));
			}
			port.onMessage.addListener(function(response) {
				if (response) {
					_reply(tabid, response);
				} else {
					_fail_with(message, "technical_error");
				}
			});
			port.onDisconnect.addListener(function() {
				console.log("QUIT " + tabid);
				delete ports[tabid];
			});
			ports[tabid] = port;
			ports[tabid].postMessage(message);
		} else {
			ports[tabid].postMessage(message);
		}
	} 
}