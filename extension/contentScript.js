//If a login form is detected, disable all
//extensions from running on this page
if(document.getElementById("password") != null) {
    chrome.runtime.sendMessage({url: location.hostname});
}