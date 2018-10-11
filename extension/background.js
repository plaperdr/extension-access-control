var websiteMap = {}; //Domains --> list of extensions that are blocked
var extensionsList;
var mode = "flexible";

//Top 50 banking websites
var sensitiveWebsites = ["paypal.com", "chase.com", "bankofamerica.com", "wellsfargo.com", "americanexpress.com", "hdfcbank.com",
    "capitalone.com", "icicibank.com", "discover.com", "td.com", "usbank.com", "commbank.com.au", "axisbank.com", "scotiabank.com",
    "chase.com", "rbcroyalbank.com", "fnb.co.za", "hangseng.com", "bmo.com", "cibc.com", "tdbank.com", "anz.com", "nab.com.au",
    "westpac.com.au", "nbg.gr", "regions.com", "bbt.com", "icbc.com.cn", "sbi.co.in", "ubs.com", "bankrate.com", "canarabank.in",
    "eurobank.gr", "ziraatbank.com.tr", "isbank.com.tr", "creditonebank.com", "53.com", "bni.co.id", "desjardins.com",
    "bankofindia.com", "nwolb.com", "online.citibank.co.in", "anz.com.au", "absa.co.za", "yesbank.in", "hsbc.com", "bsi.ir",
    "aib.ie", "standardbank.co.za", "becu.org"];


function getExtensionInfo(){
    return extensionsList;
}

function hasWebsiteSettings(site){
    return websiteMap.hasOwnProperty(site);
}

function getWebsiteSettings(site){
    return websiteMap[site];
}

function saveWebsiteSettings(site,settings){
    //Save the current policy to the map
    websiteMap[site] = settings;

    //Refresh policies
    chrome.storage.sync.clear();
    chrome.storage.sync.set(mapToSettings());
}

// Function to transform the website map to ExtensionSettings
function mapToSettings(){
    let settings = {};
    if(mode !== "strict") {
        for(let index in extensionsList) {
            settings[extensionsList[index].id] = {"runtime_blocked_hosts": []};
        }
        for (let [website, extensions] of Object.entries(websiteMap)) {
            for (let [id, allowed] of Object.entries(extensions)) {
                if (!allowed) {
                    settings[id]["runtime_blocked_hosts"].push("*://*." + website);
                }
            }
        }
    } else {
        for(let index in extensionsList) {
            settings[extensionsList[index].id] = {"runtime_blocked_hosts": ["*://*"], "runtime_allowed_hosts": []};
        }
        for (let [website, extensions] of Object.entries(websiteMap)) {
            for (let [id, allowed] of Object.entries(extensions)) {
                if (allowed) {
                    settings[id]["runtime_allowed_hosts"].push("*://*." + website);
                }
            }
        }
    }
    return { "ExtensionSettings" : settings};
}

//Function to transform the stored ExtensionSettings to a website map
function settingsToMap(settings){

    let ids = [];
    for(let extension in extensionsList){
        ids.push(extensionsList[extension].id);
    }

    let webMap = {};
    for(let extension in settings){

        //Adding the blocked website
        for(let index in settings[extension]["runtime_blocked_hosts"]){
            //Getting the url of the website
            let domain = settings[extension]["runtime_blocked_hosts"][index].substr(6);

            //If domain is not in webMap, we create it
            if(!webMap.hasOwnProperty(domain)){
                webMap[domain] = {};
                for(let index in ids){
                    webMap[domain][ids[index]] = true;
                }
            }

            //We put the domain in question as blocked
            webMap[domain][extension] = false;
        }

        //Adding the whitelisted website
        for(let index in settings[extension]["runtime_allowed_hosts"]){
            //Getting the url of the website
            let domain = settings[extension]["runtime_allowed_hosts"][index].substr(6);

            //If domain is not in webMap, we create it
            if(!webMap.hasOwnProperty(domain)){
                webMap[domain] = {};
                for(let index in ids){
                    webMap[domain][ids[index]] = true;
                }
            }

            //We put the domain in question as allowed
            webMap[domain][extension] = true;
        }


    }

    return webMap;
}

//Function to refresh the list of installed extensions
function refreshExtensionList() {
    chrome.management.getAll(function (extensions) {
        extensionsList = extensions;
        //Remove this extension from the list
        for(let index in extensionsList){
            if(extensionsList[index].id == chrome.runtime.id){
                extensionsList.splice( index, 1 );
            }
        }

        chrome.storage.sync.get(['ExtensionSettings'], function(result) {
            websiteMap = settingsToMap(result['ExtensionSettings']);
        });

    });
}

//Function to get the mode selected by the user
function getMode(){
    return mode;
}

//Function to save the mode selected by the user
function saveMode(m){
    mode = m;
    chrome.storage.local.set({"mode": m});

    //Refresh policies
    chrome.storage.sync.clear();
    chrome.storage.sync.set(mapToSettings());
}

//Function to initialize the current mode
function initMode() {
    chrome.storage.local.get({"mode": "flexible"}, function (items) {
        mode = items.mode;
    });
}

//Disable all extensions on the given URL
function disableExtensions(url) {
    let list = {};
    for(let index in extensionsList) {
        list[extensionsList[index].id] = false;
    }
    saveWebsiteSettings(url, list);
}

//Listen to messages from Content script
chrome.runtime.onMessage.addListener(
 function(request, sender, sendResponse) {
    disableExtensions(request.url);
});


//Functions to handle mode change
function flexibleMode(){
    //We reset the map
    //resetMap();

    //We remove the preloaded list
    removePreloadListFromBlacklist();

    //We save the new mode and we refresh the policy
    saveMode("flexible");
}

function sensitiveMode(){
    //We reset the map
    //resetMap();

    //We add the preloaded list
    addPreloadListFromBlacklist();

    //We save the new mode and we refresh the policy
    saveMode("sensitive");
}

function strictMode(){
    //We reset the map
    //resetMap();

    //We remove the preloaded list
    removePreloadListFromBlacklist();

    //We save the new mode and we refresh the policy
    saveMode("strict");
}

function addPreloadListFromBlacklist(){
    for(let i in sensitiveWebsites){

        //We create the list if it does not exist
        if(!websiteMap.hasOwnProperty(sensitiveWebsites[i])){
            websiteMap[sensitiveWebsites[i]] = {};
        }

        //We block all extensions
        for(let j in extensionsList) {
            websiteMap[sensitiveWebsites[i]][extensionsList[j].id] = false;
        }
    }
}

function removePreloadListFromBlacklist(){
    for(let i in sensitiveWebsites){
        delete websiteMap[sensitiveWebsites[i]];
    }
}

function resetMap(){
    websiteMap = {};
    chrome.storage.sync.clear();
    chrome.storage.sync.set(mapToSettings());
}


// Initialisation
chrome.management.onInstalled.addListener(refreshExtensionList);
chrome.management.onUninstalled.addListener(refreshExtensionList);
refreshExtensionList();
initMode();

