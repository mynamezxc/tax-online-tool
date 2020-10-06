var inuse = false;
window.addEventListener("message", function(event) {
    if (event.source !== window)
        return;
    if (event.data.src && (event.data.src === "page.js")) {
        event.data["origin"] = location.origin;
        chrome.runtime.sendMessage(event.data, function(response) {});
        if (!inuse) {
            window.addEventListener("beforeunload", function(event) {
                chrome.runtime.sendMessage({src: 'page.js', type: 'DONE'});
            }, false);
            inuse = true;
        }
    }
}, false);
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    window.postMessage(request, '*');
});