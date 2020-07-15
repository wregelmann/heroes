let 
    runningProcesses = 0,
    keysPressed = [],
    keyHistory = [];
export let keyboardShortcuts = [];
export const converter = new showdown.Converter({
        tables: true,
        simpleLineBreaks: true
    });
$(document).ajaxError(function(e, xhr, settings, error){
    UIkit.notification({message: error});
});

$( () => {
    $("body").prepend(
        `<div class="screen" style="display:none;"></div>
        <div class="loading-box" style="display:none;" uk-spinner="ratio: 2;"></div>`
    );
});

export function defineKeyboardShortcuts(shortcuts){
    keyboardShortcuts = shortcuts;
}

// Keyboard shortcuts
$(document).on("keydown", function(e){
    
    keysPressed[e.which] = true;
    keyHistory.unshift(e.which);
    if (keyHistory.length > 20) {
        keyHistory.pop();
    }

    $.each(keyboardShortcuts, (i, shortcut) => {
        switch (shortcut.type) {
            case "sequence":
                if (keyHistory.slice(0,shortcut.keys.length).equals(shortcut.keys.reverse())) {
                    shortcut.do();
                }
                break;
            case "combination":
                if (keysPressed.equals(shortcut.keys)) {
                    shortcut.do();
                }
                break;
        }
    });
    
});
$(document).on("keyup", function(e){
    keysPressed[e.which] = false;
});

export function makeUUID() {
  var uuid = "", i, random;
  for (i = 0; i < 32; i++) {
    random = Math.random() * 16 | 0;

    if (i == 8 || i == 12 || i == 16 || i == 20) {
      uuid += "-"
    }
    uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
  }
  return uuid;
}

export function startLoading(){
    runningProcesses++;
    $(".screen").show();
    $(".loading-box").show();
}

export function stopLoading(){
    runningProcesses--;
    if (runningProcesses == 0) {
        $(".screen").hide();
        $(".loading-box").hide();
    }
}

export function getUrlParams(){
    var params = [];
    if(document.location.toString().indexOf("?") !== -1) {
        var query = document.location.toString().replace(/^.*?\?/, "").replace(/#.*$/, "").split("&");
        for(var i=0, l=query.length; i<l; i++) {
           var aux = decodeURIComponent(query[i]).split("=");
           params[aux[0]] = aux[1];
        }
    }
    return params;
}

export function copyTemplate(templateSelector, slots = {}, newElement = "<div></div>"){
    let templateHtml = $(templateSelector).clone(true).html();
    let newElementClone = $(newElement).clone(true);
    $.each(slots, (name, content) => {
        templateHtml += `<span slot="${ name }">${ content }</span>`
    });
    newElementClone.html(templateHtml);
    return $(newElementClone[0]);
}

export function loop(n, callback) {
    for (let i in [...Array(n).keys()]) {
        callback(i);
    }
}

Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time 
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;       
        }           
        else if (this[i] != array[i]) { 
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;   
        }           
    }       
    return true;
}
Object.defineProperty(Array.prototype, "equals", {enumerable: false});