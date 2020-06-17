let users = [], groups = [];
let advancement = [];
let characterId;
let keys_pressed = [], key_history = [];
let running_processes = 0;
let websocket;

// Default behavior for $.ajax()
$(document).ajaxSend(function(){
    start_loading();
});
$(document).ajaxComplete(function(){
    stop_loading();
});
$(document).ajaxError(function(e, xhr, settings, error){
    UIkit.notification({message: error});
});

$(function(){
    
    $.ajax({
        url: `/api/advancement`,
        dataType: "json",
        async: false,
        success: function(data){
            $.each(data, function(i1,d1){
                advancement.push(d1.xp);
            })
        }
    });
    
    if (!get_url_params()["campaign"]) {
        UIkit.modal(".campaign-code-input-modal").show();
    } else {
        populate(get_url_params()["campaign"]);
    }

});
function populate(campaignCode){
    window.history.pushState(null,null,`?campaign=${campaignCode}`);
    $.ajax({
        url: `/api/campaigns/${campaignCode}`,
        dataType: "json",
        success: function(data){
            $.each(data.heroes, function(i1,d1){
                $(".player-select-modal ul").append(
                    `<li data-player-id="${d1.id}">${d1.name}</li>`
                );
                $(".video-grid-area").append(
                    `<div class="video-grid-area__item" data-character-id="${d1.id}">
                        <div class="uk-card uk-card-default">
                            <span class="uk-position-bottom-center">${d1.name}</span>
                        </div>
                        <progress class="uk-progress" value="${d1.hp}" max="${d1.hp_max}"></progress>
                    </div>`        
                );
                paintProgressBar($(".video-grid-area__item progress").last());
            });
            UIkit.modal(".player-select-modal").show();
        },
        error: function(){
            window.location.href = `error.php?code=404`;
        }
    });   
}

$(document).on("click", ".campaign-code-input-modal .uk-button", function(){
    submitCampaignCode();
});
$(document).on("keydown", ".campaign-code-input-modal .uk-input", function(e){
    if (e.which == 13) {
        submitCampaignCode();
    }
});
function submitCampaignCode(){
    var campaignCode = $(".campaign-code-input-modal .uk-input").val();
    $.ajax({
        url: `/api/campaigns/${campaignCode}`,
        dataType: "json",
        success: function(){
            UIkit.modal(".campaign-code-input-modal").hide();
            populate(campaignCode);
        },
        error: function(){
            $(".campaign-code-input-modal .uk-input").addClass("uk-animation-shake");
            $(".campaign-code-input-modal .uk-input").one("animationend", function(){
                $(".campaign-code-input-modal .uk-input").removeClass("uk-animation-shake");
            });
        }
    });
}

$(document).on("click", ".menu__character-icon", function(){
       populateCharacterDetailModal(characterId);
});
function populateCharacterDetailModal(thisCharacterId){
    $.ajax({
        url: `/api/heroes/${thisCharacterId}`,
        dataType: "json",
        success: function(data){
            $(".character-detail-modal__name").html(data.name);
            UIkit.modal(".character-detail-modal").show();
            var classes = []; 
            var total_level = 0;
            $.each(data.classes, function(i1,d1){
                total_level += d1.level;
                classes.push(`Level ${d1.level} ${d1.class}`);
            });
            $(".character-detail-modal progress").val(`${Math.max(data.xp - advancement[total_level - 1], 0)}`);
            $(".character-detail-modal progress").attr("max", parseInt(advancement[parseInt(total_level)]) - advancement[total_level - 1]);
            $(".character-detail-modal progress").attr("uk-tooltip", `${data.xp} / ${advancement[parseInt(total_level)]}`);
            if (parseInt(data.xp) >= parseInt(advancement[parseInt(total_level)])) {
                $(".character-detail-modal progress").attr("p", 5);
            } else {
                $(".character-detail-modal progress").removeAttr("p");
            }
            $(".character-detail-modal__class").html(`${classes.join(", ")} (+${Math.ceil(total_level / 4) + 1})`);
            $(".character-detail-modal__ac").html(data.ac);
            $(".character-detail-modal__speed").html(data.speed);
            $(".character-detail-modal__abilities th").each(function(i1,d1){
                if (data.saving_throws.includes($(this).text())) {
                    $(this).addClass("bold");
                } else {
                    $(this).removeClass("bold");
                }
            });
            $(".character-detail-modal__abilities td").each(function(i1,d1){
                switch (i1) {
                    case 0:
                        $(this).html(`${data.str} (${abilityModifier(data.str)})`);
                        break;
                    case 1:
                        $(this).html(`${data.dex} (${abilityModifier(data.dex)})`);
                        break;
                    case 2:
                        $(this).html(`${data.con} (${abilityModifier(data.con)})`);
                        break;
                    case 3:
                        $(this).html(`${data.int} (${abilityModifier(data.int)})`);
                        break;
                    case 4:
                        $(this).html(`${data.wis} (${abilityModifier(data.wis)})`);
                        break;
                    case 5:
                        $(this).html(`${data.cha} (${abilityModifier(data.cha)})`);
                        break;
                }
            });
            $(".character-detail-modal__skills").html(null);
            $.each(data.skills, function(i1,d1){
                $(".character-detail-modal__skills").append(
                    `<li>${d1.name} (${d1.ability})</li>`
                );
            });
        }
    });
}
function abilityModifier(score){
    mod = Math.floor((score - 10)/2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
}

$(document).on("click", ".menu__spellbook-icon", function(){
    $(".spellbook-modal .uk-modal-body").html(null);
    $.ajax({
        url: `/api/heroes/${characterId}`,
        dataType: "json",
        success: function(data){
            $.each(data.classes, function(i1,d1){
                if(d1.spellcasting_ability != null) {
                    $(".spellbook-modal .uk-modal-body").append(
                        `<h3>${d1.class}, Level ${d1.level}</h3>
                        <table class="uk-table uk-table-divider">
                            <thead>
                                <tr>
                                    <th>Spellcasting ability</th>
                                    <th>Spell save DC</th>
                                    <th>Spell attack bonus</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>${d1.spellcasting_ability.toUpperCase()}</td>
                                    <td>${d1.spell_save_dc}</td>
                                    <td>+${d1.spell_attack_bonus}</td>
                                </tr>
                            </tbody>
                        </table>
                        <ul class="uk-list uk-list-striped" uk-accordion></ul>`
                    );
                    $.each(d1.spells, function(i2,d2){
                        $(".spellbook-modal .uk-modal-body > ul").append(
                            `<li data-spell-id="${d2.id}">
                                <a class="uk-accordion-title" href="#">${d2.name}</a>
                                <div class="uk-accordion-content"></div>
                            </li>`
                        );
                    });
                }
            });
        }
    });
    UIkit.modal(".spellbook-modal").show();
});
$(document).on("click", ".spellbook-modal li[data-spell-id]", function(){
    var element = $(this).find(".uk-accordion-content");
    var id = $(this).attr("data-spell-id");
    $.ajax({
        url: `/api/spells/${id}`,
        dataType: "json",
        global: false,
        success: function(data){
            var components = [];
            if (data.v == 1) {
                components.push("V");
            }
            if (data.s == 1) {
                components.push("S");
            }
            if (data.m != "") {
                components.push(`M (${data.m})`);
            }
            element.html(
                `<div><i>${data.spell_school} ${parseInt(data.level) > 0 ? "Level-"+data.level : "Cantrip"}</i></div>
                <div>
                    ${data.ritual == 1 ? "Ritual" : ""}
                    ${data.ritual == 1 && data.concentration == 1 ? ", " : ""}
                    ${data.concentration == 1 ? "Concentration" : ""}
                </div>
                <table class="uk-table uk-table-divider">
                    <thead>
                        <tr>
                            <th>Cast time</th><th>Range</th><th>Duration</th><th>Components</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${data.casting_time}</td><td>${data.range}</td><td>${data.duration}</td><td>${components.join(", ")}</td>
                        </tr>
                    </tbody>
                </table>
                <div>${data.description}</div>
                <div>${data.higher_levels != "" ? "<br><b>At higher levels:</b>" : ""} ${data.higher_levels}</div>`
            );
        }
    });
});

function paintProgressBar(element){
    element.attr("p", Math.ceil(5 * parseInt(element.val()) / parseInt(element.attr("max"))));
    element.attr("uk-tooltip", `title: ${element.val()} / ${element.attr("max")}; pos: bottom;`);
}

$(document).on("click", ".player-select-modal li", function(){
    UIkit.notification(`Welcome, ${$(this).text()}!`);
    UIkit.modal(".player-select-modal").hide();
    join($(this).attr("data-player-id"));
});
function join(playerId){
    
    if (playerId == null) {
        $(".dm-visible").show();
        $(".video-grid-area__item span").addClass("clickable");
        $(document).on("click", ".video-grid-area__item span", function(){
            populateCharacterDetailModal($(this).parents(".video-grid-area__item").attr("data-character-id"));
        });
        $(document).on("click", ".video-grid-area__item progress", function(){
            var element = $(this);
            UIkit.modal.prompt("Change").then(function(delta){
                element.val(parseInt(element.val()) + parseInt(delta));
                paintProgressBar(element);
            });
        });
    } else {
        $(".pc-visible").show();
        characterId = playerId;
    }
    
    websocket = new WebSocket("wss://app.heroes.willandbritta.com");
    websocket.onopen = function(e){
    }
    websocket.onmessage = function(e){
        console.log(e.data);
    }
}

// Keyboard shortcuts
$(document).on("keydown", function(e){
     
    
    keys_pressed[e.which] = true;
    key_history.unshift(e.which);
    if (key_history.length > 20) {
        key_history.pop();
    }

    if ($(".player-select-modal").is(":visible")) {
        if (key_history.slice(0,11).equals([13,65,66,39,37,39,37,40,40,38,38])) {
            UIkit.notification("God mode activated");
            UIkit.modal(".player-select-modal").hide();
            join(null);
        }
    }
    
    // Ctrl+Shift+F: Quick omni-search
    if (keys_pressed[16] && keys_pressed[17] && keys_pressed[70]) {
        e.preventDefault();
        var selection = window.getSelection();
        var query = selection.toString().trim();
        var rect = selection.getRangeAt(0).getBoundingClientRect();
        window.getSelection().removeAllRanges();
        console.log(rect);
        $.ajax({
            url: `${base_path}/api/search`,
            data: {
                query: query
            },
            success: function(data){
                if (Object.entries(data).length) {
                    new_html = "";
                    $.each(data, function (i1, d1) {
                        new_html += `<li class="uk-nav-header">${i1}</li>`;
                        $.each(d1, function (i2, d2) {
                            new_html += `<li data-location="${d2.location}" data-params='${d2.params}'>${d2.text}</li>`
                        });
                    });
                } else {
                    new_html = "<li>No results found :(</li>";
                }
                $(".omnisearch-dropdown > ul").html(new_html);
                UIkit.dropdown(".omnisearch-dropdown").show();
                $(".omnisearch-dropdown-anchor").css("top", rect.bottom);
                $(".omnisearch-dropdown-anchor").css("left", rect.left);
            },
            dataType: "json"
        })
    }
    
    // Ctrl+Shift+Space: Open omnisearch
    else if (keys_pressed[16] && keys_pressed[17] && keys_pressed[32]) {
        e.preventDefault();
        UIkit.offcanvas(".menu").show();
        if ($(".menu__submenu-search").attr("hidden")) {
            UIkit.toggle(".menu__toggle").toggle();
        }
        $(".menu__omnisearch input").focus();
    }
    
    // Ctrl+Shift+M: Open omnisearch
    else if (keys_pressed[16] && keys_pressed[17] && keys_pressed[77]) {
        e.preventDefault();
        UIkit.offcanvas(".menu").show();
        if ($(".menu__submenu-default").attr("hidden")) {
            UIkit.toggle(".menu__toggle").toggle();
        }
    }
    
    // Ctrl+Shift+D: Dial highlighted number
    else if (keys_pressed[16] && keys_pressed[17] && keys_pressed[68]) {
        e.preventDefault();
        dial(window.getSelection().toString().trim());
    }
    
    // Ctrl+Shift+(?|H): Dial highlighted number
    else if (keys_pressed[16] && keys_pressed[17] && (keys_pressed[191] || keys_pressed[72])) {
        e.preventDefault();
        $.ajax({
            url: `${base_path}/api`,
            success: function(data){
                $(".help-modal .uk-modal-footer .version").html(data.version);
            },
            global: false,
            dataType: "json"
        });
        UIkit.modal(".help-modal").show();
    }

});
$(document).on("keyup", function(e){
    keys_pressed[e.which] = false;
});

function uuid() {
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

function start_loading(){
    running_processes++;
    $(".screen").show();
    $(".loading-box").show();
}

function stop_loading(){
    running_processes--;
    if (running_processes == 0) {
        $(".screen").hide();
        $(".loading-box").hide();
    }
}

function get_url_params(){
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
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", {enumerable: false});