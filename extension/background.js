var websiteMap = {}; //Domains --> list of extensions that are blocked
var extensionsList;

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
    for(let index in extensionsList) {
        settings[extensionsList[index].id] = {"runtime_blocked_hosts": []};
    }

    for (let [website, extensions] of Object.entries(websiteMap)) {
        for (let [id, allowed] of Object.entries(extensions)) {
            if(!allowed){
                settings[id]["runtime_blocked_hosts"].push("*://*."+website);
            }
        }
    }
    return { "ExtensionSettings" : settings };
}

//Function to transform the stored ExtensionSettings to a website map
function settingsToMap(settings){

    let ids = [];
    for(let extension in extensionsList){
        ids.push(extensionsList[extension].id);
    }

    let webMap = {};
    for(let extension in settings){
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
    }

    return webMap;
}

//Function to refresh the list of installed extensions
function refreshExtensionList() {
    chrome.management.getAll(function (extensions) {
        extensionsList = extensions;
        //Remove this extension from the list
        for(let index in extensionsList){
            if(extensionsList[index].id == "ifgcaoanjmfgpnkolhcoddhncdphkfnm"){
                extensionsList.splice( index, 1 );
            }
        }

        chrome.storage.sync.get(['ExtensionSettings'], function(result) {
            websiteMap = settingsToMap(result['ExtensionSettings']);
        });

    });
}

// Initialisation
chrome.management.onInstalled.addListener(refreshExtensionList);
chrome.management.onUninstalled.addListener(refreshExtensionList);
refreshExtensionList();