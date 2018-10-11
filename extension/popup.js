function addAllExtensions() {
    // For each extension, we add it in the popup
    // If there is already an existing configuration,
    // we update the popup to reflect it

    //Get the list of current extensions
    var extensions = background.getExtensionInfo();

    if(background.hasWebsiteSettings(url)){

        //Get the list of settings for the current domain
        var settings = background.getWebsiteSettings(url);

        for (let i = 0; i < extensions.length; i++) {
            let e = extensions[i];

            //Get the settings from the background script
            addExtension(e.name, e.id, settings[e.id]);
        }
    } else {
        for (let i = 0; i < extensions.length; i++) {
            let e = extensions[i];

            //Get the settings from the background script
            addExtension(e.name, e.id, mode !== "strict");
        }
    }
}

function addExtension(name, id, enabled) {
    var newRow = $("<tr>");
    var cols = "";

    cols += '<td>' + name + '</td>';
    //Add the button with the id of the extension in it
    cols += '<td><input data-toggle="toggle" data-on="Enabled" data-off="Disabled" type="checkbox" data-height="40" ' +
        'data-width="100" id="'+id+'" ';
    if(enabled) cols += 'checked';
    cols += '></td>';

    newRow.append(cols);
    $('#myTable > tbody:last-child').append(newRow);
}

//Get the background page
var background = chrome.extension.getBackgroundPage();

//Get the current mode
var mode = background.getMode();

//Get the URL of the open tab
var url;
chrome.tabs.query({ active: true, currentWindow: true }, function(tabs){
    var info = tldjs.parse(tabs[0].url);
    if(info.tldExists && info.domain != null){
        url = info.domain;
        document.getElementById("url").textContent = url;
        setup();
    } else {
        document.getElementById("url").textContent = "Not a valid URL";
        $("#myTable").hide();
        $("#btnGroup").hide();
        $("#settings").hide();
    }
});

function setup() {
    //Add all extensions and their settings to the popup
    addAllExtensions();

    $(document).ready(function () {

        //When one button from the extension list clicked, reflect the changes and save them
        $("#myTable :input").change(function(){
            var list = {};
            $("#myTable :input").each(function (index) {
                list[$(this).prop("id")] = $(this).prop("checked");
            });
            //Send this to be saved
            background.saveWebsiteSettings(url,list);
        });

        //When the settings button is clicked, we open the options
        $("#settings").click(function() {
            chrome.runtime.openOptionsPage();
        });
    });
}