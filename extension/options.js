var background = chrome.extension.getBackgroundPage();

function restore_options() {
  chrome.storage.local.get({
    mode: 'flexible',
  }, function(items) {
    document.getElementById("selectMode").value = items.mode;
  });
}

function changeMode(mode) {
    console.log("changeMode");
    switch (mode) {
        case "sensitive":
            background.sensitiveMode();
            break;
        case "strict":
            background.strictMode();
            break;
        default:
            background.flexibleMode();
    }
}

function resetMap(){
 background.resetMap();
}

document.addEventListener('DOMContentLoaded', restore_options);

document.getElementById("reset").addEventListener("click", function( event ) {
 resetMap();
}, false);

document.getElementById("selectMode").addEventListener("change", function( event ) {
 console.log("POUET");
 changeMode(event.target.value);
}, false);