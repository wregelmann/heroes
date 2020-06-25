let 
    running_processes = 0,
    keys_pressed = [],
    key_history = [],
    characterId = null,
    player,
    advancement = [],
    peer,
    connections = [],
    calls = [],
    localVideo,
    localStream,
    coord = {x:0 , y:0},
    path = [],
    drawings = [],
    myColor = "#39f",
    paint = false,
    erase = false;
const
    ctx = $(".tabletop-area canvas")[0].getContext("2d"),
    mediaStreamConstraints = {
        audio: true,
        video: true
    },
    converter = new showdown.Converter({
        tables: true,
        simpleLineBreaks: true
    });

$(document).ajaxError(function(e, xhr, settings, error){
    UIkit.notification({message: error});
});

$(function(){    
    if (!get_url_params()["campaign"]) {
        UIkit.modal(".campaign-code-input-modal").show();
    } else {
        populate(get_url_params()["campaign"]);
    }
});

function populate(campaignCode){
    window.history.pushState(null,null,`?campaign=${campaignCode}`);
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
                            <video autoplay playsinline></video>
                            <span class="uk-position-bottom-center">${d1.name}</span>
                            <div class="video-grid-area__mute-button uk-position-center clickable"><i class="fas fa-volume-slash uk-position-center"></i></div>
                        </div>
                        <progress class="uk-progress" value="${d1.hp}" max="${d1.hp_max}"></progress>
                    </div>`        
                );
                $(".tabletop-area__initiative-tracker > ul").append(
                    `<li><span class="uk-badge clickable"></span> ${d1.name}</li>`
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

$(document).on("click", ".menu__dm-initiative-icon", function(){
    console.log($(".tabletop-area__initiative-tracker").css("display"));
    if ($(".tabletop-area__initiative-tracker").css("display") == "none") {
        $(".tabletop-area__initiative-tracker").css("display", "flex");
    } else {
        $(".tabletop-area__initiative-tracker").css("display", "none");
    }
    drawCanvas();
});
$(document).on("click", ".tabletop-area__initiative-tracker .uk-badge", function(){
    var element = $(this).parents("li");
    UIkit.modal.prompt("Initiative:").then(function(val){
        var newElement = element.clone(true);
        newElement.find(".uk-badge").html(val);
        element.remove();
        var found = false;
        if (val !== "") {
            $(".tabletop-area__initiative-tracker > ul li").each(function(){
                if (parseInt(newElement.find(".uk-badge").text()) > parseInt($(this).find(".uk-badge").text()) || !parseInt($(this).find(".uk-badge").text())) {
                    $(this).before(newElement);
                    found = true;
                    return false;
                }
            });
            if (!found) {
                $(".tabletop-area__initiative-tracker > ul").append(newElement);
            }
        }
    });
});
$(document).on("click", ".tabletop-area__initiative-tracker button", function(){
    UIkit.modal.prompt("Name:").then(function(name){
        UIkit.modal.prompt("HP:").then(function(hp){
            $(".tabletop-area__initiative-tracker ul").append(
                `<li>
                    <span class="uk-badge clickable"></span> ${name}
                    <progress class="uk-progress" max="${hp}" value="${hp}"></progress>
                </li>`
            );
            paintProgressBar($(".tabletop-area__initiative-tracker ul li:last progress"));
        });
    });
});

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
        global: false,
        success: function(data){
            $(".character-detail-modal__name").html(data.name);
            $(".character-detail-modal").attr("data-character-id", thisCharacterId);
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
    populateSpellbookModal(characterId);
});
$(document).on("click", ".character-detail-modal__spells-button", function(){
    populateSpellbookModal($(this).parents(".character-detail-modal").attr("data-character-id"));
});
$(document).on("click", ".spellbook-modal .uk-accordion-content button", function(){
    var heroId = $(this).parents(".spellbook-modal").attr("data-hero-id");
    var heroClassId = $(this).parents(".uk-modal-body").attr("data-hero-class-id");
    var spellId = $(this).parents("li").attr("data-spell-id");
    $.ajax({
        url: `/api/heroes/${heroId}`,
        type: "PATCH",
        data: {
            remove: {
                spells: [{
                    id: spellId,
                    heroClassId: heroClassId
                }]
            }
        },
        dataType: "json",
        global: false,
        success: function(){
            UIkit.modal(".spellbook-modal").hide();
        }
    });
});
function populateSpellbookModal(thisCharacterId){
    $(".spellbook-modal .uk-modal-dialog").html(null);
    $(".spellbook-modal").attr("data-hero-id", thisCharacterId);
    $.ajax({
        url: `/api/heroes/${thisCharacterId}`,
        dataType: "json",
        global: false,
        success: function(data){
            $.each(data.classes, function(i1,d1){
                if(d1.spellcasting_ability != null) {
                    $(".spellbook-modal .uk-modal-dialog").append(
                        `<div class="uk-modal-body" data-hero-class-id="${d1.id}">
                            <h3>${d1.class}, Level ${d1.level}</h3>
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
                            <ul class="uk-list uk-list-striped" uk-accordion></ul>
                        </div>`
                    );
                    $.each(d1.spells, function(i2,d2){
                        $.ajax({
                            url: `/api/spells/${d2.id}`,
                            dataType: "json",
                            global: false,
                            async: false,
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
                                $(".spellbook-modal .uk-modal-body > ul").append(
                                    `<li data-spell-id="${d2.id}">
                                        <a class="uk-accordion-title" href="#">${d2.name}</a>
                                        <div class="uk-accordion-content">
                                            <div><i>${data.spell_school} ${parseInt(data.level) > 0 ? "Level-"+data.level : "Cantrip"}</i></div>
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
                                            <div>${converter.makeHtml(data.description)}</div>
                                            <div>${data.higher_levels != "" ? "<br><b>At higher levels:</b>" : ""} ${converter.makeHtml(data.higher_levels)}</div>
                                            ${characterId == null ? `<button class="uk-button uk-button-primary">Revoke</button>` : ""}
                                        </div>
                                    </li>`
                                );
                            }
                        });
                    });
                }
            });
        }
    });
    UIkit.modal(".spellbook-modal").show();
}

$(document).on("click", ".menu__inventory-icon", function(){
    populateInventoryModal(characterId);
});
$(document).on("click", ".character-detail-modal__inventory-button", function(){
    populateInventoryModal($(this).parents(".character-detail-modal").attr("data-character-id"));
});
$(document).on("click", ".inventory-modal .uk-accordion-content button", function(){
    var heroId = $(this).parents(".inventory-modal").attr("data-hero-id");
    var itemId = $(this).parents("li").attr("data-item-id");
    UIkit.modal.prompt("Quantity:").then(function(n){
        $.ajax({
            url: `/api/heroes/${heroId}`,
            type: "PATCH",
            data: {
                remove: {
                    items: [{
                        id: itemId,
                        quantity: n
                    }]
                }
            },
            dataType: "json",
            global: false,
            success: function(){
                UIkit.modal(".inventory-modal").hide();
            }
        });
    });
});
function populateInventoryModal(thisCharacterId){
    $(".inventory-modal .uk-modal-body > ul").html(null);
    $(".inventory-modal").attr("data-hero-id", thisCharacterId);
    $.ajax({
        url: `/api/heroes/${thisCharacterId}`,
        dataType: "json",
        global: false,
        success: function(data){
            $.each(data.inventory, function(i1,d1){
                $.ajax({
                    url: `/api/items/${d1.id}`,
                    dataType: "json",
                    global: false,
                    success: function(data){
                        $(".inventory-modal .uk-modal-body > ul").append(
                            `<li data-item-id="${d1.id}">
                                <a class="uk-accordion-title" href="#">${d1.name} (${d1.quantity})</a>
                                <div class="uk-accordion-content">
                                    <div>${converter.makeHtml(data.description)}</div>
                                    ${characterId == null ? `<button class="uk-button uk-button-primary">Remove</button>` : ""}
                                </div>
                            </li>`
                        );
                    }
                });
            });
        }
    });
    UIkit.modal(".inventory-modal").show();
}

$(document).on("click", ".menu__features-icon", function(){
    populateFeaturesModal(characterId);
});
$(document).on("click", ".character-detail-modal__features-button", function(){
    populateFeaturesModal($(this).parents(".character-detail-modal").attr("data-character-id"));
});
$(document).on("click", ".features-modal .uk-accordion-content button", function(){
    var heroId = $(this).parents(".features-modal").attr("data-hero-id");
    var featureId = $(this).parents("li").attr("data-feature-id");
    $.ajax({
        url: `/api/heroes/${heroId}`,
        type: "PATCH",
        data: {
            remove: {
                features: [{
                    id: featureId
                }]
            }
        },
        dataType: "json",
        global: false,
        success: function(){
            UIkit.modal(".features-modal").hide();
        }
    });
});
function populateFeaturesModal(thisCharacterId){
    $(".features-modal .uk-modal-body > ul").html(null);
    $(".features-modal").attr("data-hero-id", thisCharacterId);
    $.ajax({
        url: `/api/heroes/${thisCharacterId}`,
        dataType: "json",
        global: false,
        success: function(data){
            $.each(data.features, function(i1,d1){
                $.ajax({
                    url: `/api/features/${d1.id}`,
                    dataType: "json",
                    global: false,
                    success: function(data){
                        $(".features-modal .uk-modal-body > ul").append(
                            `<li data-feature-id="${d1.id}">
                                <a class="uk-accordion-title" href="#">${d1.name}</a>
                                <div class="uk-accordion-content">
                                    <div>${converter.makeHtml(data.description)}</div>
                                    ${characterId == null ? `<button class="uk-button uk-button-primary">Revoke</button>` : ""}
                                </div>
                            </li>`
                        );
                    }
                });
            });
        }
    });
    UIkit.modal(".features-modal").show();
}

function paintProgressBar(element){
    element.attr("p", Math.ceil(5 * parseInt(element.val()) / parseInt(element.attr("max"))));
    element.attr("uk-tooltip", `title: ${element.val()} / ${element.attr("max")}; pos: bottom;`);
}

$(document).on("click", ".menu__dm-spells-icon", function(){
    $.ajax({
        url: `/api/spells`,
        dataType: "json",
        global: false,
        success: function(data){
            $(".dm-spells-modal ul.uk-list").html(null);
            $.each(data, function(i1,d1){
                $(".dm-spells-modal ul.uk-list").append(
                    `<li class="clickable" data-spell-id="${d1.id}">
                        <div class="toggle"><span>${d1.name}</span></div>
                        <div class="uk-accordion-content">
                            <div class="dm-spells-modal__spell-description"></div>
                            <button class="uk-button uk-button-primary">Grant</button>
                        </div>
                    </li>`
                );
            });
            UIkit.modal(".dm-spells-modal").show();
        }
    });
});
$(document).on("click", ".dm-spells-modal li[data-spell-id]", function(){
    var id = $(this).attr("data-spell-id");
    var element = $(this);
    $.ajax({
        url: `/api/spells/${id}`,
        dataType: "json",
        global: false,
        success: function(data){
            element.find(".dm-spells-modal__spell-description").html(
                `${converter.makeHtml(data.description)}`
            );
        }
    });
});
$(document).on("click", ".dm-spells-modal .uk-modal-footer > a", function(){
    UIkit.modal(".spell-add-modal").show();
});
$(document).on("click", ".spell-add-modal button", function(){
    var element = $(this).parents(".uk-modal-dialog").find(".uk-modal-body");
    $.ajax({
        url: `/api/spells`,
        type: "POST",
        global: false,
        data: {
            name: element.find(".spell-add-modal__name").val(),
            description: element.find(".spell-add-modal__description").val(),
            higherLevels: element.find(".spell-add-modal__higher-levels").val(),
            range: element.find(".spell-add-modal__range").val(),
            v: element.find(".spell-add-modal__v").prop("checked") == true,
            s: element.find(".spell-add-modal__v").prop("checked") == true,
            m: element.find(".spell-add-modal__materials").val(),
            concentration: element.find(".spell-add-modal__concentration").prop("checked") == true,
            ritual: element.find(".spell-add-modal__ritual").prop("checked") == true,
            duration: element.find(".spell-add-modal__duration").val(),
            castingTime: element.find(".spell-add-modal__casting-time").val(),
            level: element.find(".spell-add-modal__level option:selected").val(),
            school: element.find(".spell-add-modal__school option:selected").val()
        },
        success: function(){
            UIkit.notification(`Added ${element.find(".spell-add-modal__name").val()}`);
            UIkit.modal(".spell-add-modal").hide();
        }
    });
});
$(document).on("click", ".dm-spells-modal li button", function(){
    var spellId = $(this).parents("li").attr("data-spell-id");
    var spellName = $(this).parents("li").find(".toggle > span").text();
    $.ajax({
        url: `/api/campaigns/${get_url_params()["campaign"]}`,
        dataType: "json",
        global: false,
        success: function(data){
            var newHtml = "";
            $.each(data.heroes, function(i1,d1){
                $.ajax({
                    url: `/api/heroes/${d1.id}`,
                    dataType: "json",
                    global: false,
                    async: false,
                    success: function(data){
                        $.each(data.classes, function(i2,d2){
                            if (d2.spellcasting_ability) {
                                newHtml +=  `<li class="clickable" data-hero-id="${d1.id}" data-hero-class-id="${d2.id}">${d1.name} (${d2.class})</li>`;
                            }
                        });
                    }
                });
            });
            var characterSelectModal = UIkit.modal.dialog(
                `<div class="ad-hoc-modal uk-modal-body">
                    <ul class="uk-list uk-list-striped">${newHtml}</ul>
                </div>`
            );
            $(".ad-hoc-modal li").click(function(){
                var heroId = $(this).attr("data-hero-id");
                var heroClassId = $(this).attr("data-hero-class-id");
                var characterName = $(this).text();
                $.ajax({
                    url: `/api/heroes/${heroId}`,
                    type: "PATCH",
                    dataType: "json",
                    global: false,
                    data: {
                        add: {
                            spells: [{
                                id: spellId,
                                heroClassId: heroClassId
                            }]
                        }
                    },
                    success: function(){
                        characterSelectModal.hide();
                        UIkit.notification(`Granted ${spellName} to ${characterName}`);
                    }
                });
            });
        }
    });
});

$(document).on("click", ".menu__dm-items-icon", function(){
    $.ajax({
        url: `/api/items`,
        dataType: "json",
        global: false,
        success: function(data){
            $(".dm-items-modal ul.uk-list").html(null);
            $.each(data, function(i1,d1){
                $(".dm-items-modal ul.uk-list").append(
                    `<li class="clickable" data-item-id="${d1.id}">
                        <div class="toggle"><span>${d1.name}</span> <i class="uk-align-right">${d1.type}</i></div>
                        <div class="uk-accordion-content">
                            <div class="dm-items-modal__item-description"></div>
                            <button class="uk-button uk-button-primary">Give</button>
                        </div>
                    </li>`
                );
            });
            UIkit.modal(".dm-items-modal").show();
        }
    });
});
$(document).on("click", ".dm-items-modal li[data-item-id]", function(){
    var id = $(this).attr("data-item-id");
    var element = $(this);
    $.ajax({
        url: `/api/items/${id}`,
        dataType: "json",
        global: false,
        success: function(data){
            element.find(".dm-items-modal__item-description").html(converter.makeHtml(data.description));
        }
    });
});
$(document).on("click", ".dm-items-modal .uk-modal-footer > a", function(){
    UIkit.modal(".item-add-modal").show();
});
$(document).on("click", ".item-add-modal button", function(){
    var element = $(this).parents(".uk-modal-dialog").find(".uk-modal-body");
    $.ajax({
        url: `/api/items`,
        type: "POST",
        global: false,
        data: {
            name: element.find(".item-add-modal__name").val(),
            type: element.find(".item-add-modal__type option:selected").val(),
            description: element.find(".item-add-modal__description").val()
        },
        success: function(){
            UIkit.notification(`Added ${element.find(".item-add-modal__name").val()}`);
            UIkit.modal(".item-add-modal").hide();
        }
    });
});
$(document).on("click", ".dm-items-modal li button", function(){
    var itemId = $(this).parents("li").attr("data-item-id");
    var itemName = $(this).parents("li").find(".toggle > span").text();
    UIkit.modal.prompt("Quantity:").then(function(n){
        n = n == "" ? 1 : n;
        $.ajax({
            url: `/api/campaigns/${get_url_params()["campaign"]}`,
            dataType: "json",
            global: false,
            success: function(data){
                var newHtml = "";
                $.each(data.heroes, function(i1,d1){
                    newHtml +=  `<li class="clickable" data-character-id="${d1.id}">${d1.name}</li>`;
                });
                var characterSelectModal = UIkit.modal.dialog(
                    `<div class="ad-hoc-modal uk-modal-body">
                        <ul class="uk-list uk-list-striped">${newHtml}</ul>
                    </div>`
                );
                $(".ad-hoc-modal li").click(function(){
                    var playerId = $(this).attr("data-character-id");
                    var characterName = $(this).text();
                    $.ajax({
                        url: `/api/heroes/${playerId}`,
                        type: "PATCH",
                        dataType: "json",
                        global: false,
                        data: {
                            add: {
                                items: [{
                                    id: itemId,
                                    quantity: n
                                }]
                            }
                        },
                        success: function(){
                            characterSelectModal.hide();
                            UIkit.notification(`Gave ${n}x ${itemName} to ${characterName}`);
                        }
                    });
                });
            }
        });
    });
});

$(document).on("click", ".menu__dm-features-icon", function(){
    $.ajax({
        url: `/api/features`,
        dataType: "json",
        global: false,
        success: function(data){
            $(".dm-features-modal ul.uk-list").html(null);
            $.each(data, function(i1,d1){
                $(".dm-features-modal ul.uk-list").append(
                    `<li class="clickable" data-feature-id="${d1.id}">
                        <div class="toggle">${d1.name}</div>
                        <div class="uk-accordion-content">
                            <div class="dm-features-modal__feature-description"></div>
                            <button class="uk-button uk-button-primary">Grant</button>
                        </div>
                    </li>`
                );
            });
            UIkit.modal(".dm-features-modal").show();
        }
    });
});
$(document).on("click", ".dm-features-modal li[data-feature-id]", function(){
    var id = $(this).attr("data-feature-id");
    var element = $(this);
    $.ajax({
        url: `/api/features/${id}`,
        dataType: "json",
        global: false,
        success: function(data){
            element.find(".dm-features-modal__feature-description").html(converter.makeHtml(data.description));
        }
    });
});
$(document).on("click", ".dm-features-modal .uk-modal-footer > a", function(){
    UIkit.modal(".feature-add-modal").show();
});
$(document).on("click", ".feature-add-modal button", function(){
    var element = $(this).parents(".uk-modal-dialog").find(".uk-modal-body");
    $.ajax({
        url: `/api/features`,
        type: "POST",
        global: false,
        data: {
            name: element.find(".feature-add-modal__name").val(),
            type: element.find(".feature-add-modal__type option:selected").val(),
            description: element.find(".feature-add-modal__description").val()
        },
        success: function(){
            UIkit.notification(`Added ${element.find(".feature-add-modal__name").val()}`);
            UIkit.modal(".feature-add-modal").hide();
        }
    });
});
$(document).on("click", ".dm-features-modal li button", function(){
    var featureId = $(this).parents("li").attr("data-feature-id");
    var featureName = $(this).parents("li").find(".toggle > span").text();
    $.ajax({
        url: `/api/campaigns/${get_url_params()["campaign"]}`,
        dataType: "json",
        global: false,
        success: function(data){
            var newHtml = "";
            $.each(data.heroes, function(i1,d1){
                newHtml +=  `<li class="clickable" data-character-id="${d1.id}">${d1.name}</li>`;
            });
            var characterSelectModal = UIkit.modal.dialog(
                `<div class="ad-hoc-modal uk-modal-body">
                    <ul class="uk-list uk-list-striped">${newHtml}</ul>
                </div>`
            );
            $(".ad-hoc-modal li").click(function(){
                var playerId = $(this).attr("data-character-id");
                var characterName = $(this).text();
                $.ajax({
                    url: `/api/heroes/${playerId}`,
                    type: "PATCH",
                    dataType: "json",
                    global: false,
                    data: {
                        add: {
                            features: [{
                                id: featureId
                            }]
                        }
                    },
                    success: function(){
                        characterSelectModal.hide();
                        UIkit.notification(`Granted ${featureName} to ${characterName}`);
                    }
                });
            });
        }
    });
});

$(document).on("keyup", ".uk-modal-header input.filter", function(){
    var filter = $(this).val().toLowerCase();
    var order = 1;
    $(this).parents(".uk-modal-dialog").find(".uk-modal-body ul.uk-list > li").each(function(){
        if ($(this).text().toLowerCase().includes(filter)) {
            $(this).show();
            if (order == 1) {
                $(this).css("background", "#f8f8f8");
                $(this).css("border-top", "1px solid #e5e5e5");
                $(this).css("border-bottom", "1px solid #e5e5e5");
            } else {
                $(this).css("background", "white");
                $(this).css("border-top", "none");
                $(this).css("border-bottom", "none");
            }
            order *= -1;
        } else {
            $(this).hide();
        }
    });
});

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
        $(document).on("click", ".video-grid-area__item progress, .tabletop-area__initiative-tracker progress", function(){
            var element = $(this);
            UIkit.modal.prompt("Change:").then(function(delta){
                element.val(parseInt(element.val()) + parseInt(delta));
                paintProgressBar(element);
                var heroId = element.parents(".video-grid-area__item").attr("data-character-id");
                $.ajax({
                    url: `/api/heroes/${heroId}`,
                    type: "PATCH",
                    data: {
                        update: {
                            hp: parseInt(element.val())
                        }
                    },
                    dataType: "json",
                    global: false,
                    success: function(){
                        $.each(connections, function(i1,d1){
                            d1.send({
                                type: "directive",
                                directive: "updateHp",
                                hero: heroId,
                                change: delta
                            });
                        });
                    }
                });
            });
        });
        localVideo = $(".tabletop-area video")[0];
        navigator.mediaDevices.getUserMedia(mediaStreamConstraints).then(function(stream){
            localStream = stream;
            localVideo.srcObject = localStream;
            drawCanvas();
        });
    } else {
        $(".pc-visible").show();
        characterId = playerId;
        $.ajax({
            url: `/api/heroes/${playerId}`,
            dataType: "json",
            global: false,
            async: false,
            success: function(data){
                player = data;
            }
        });
    }
    
    $(".video-grid-area__item video").each(function(){
        var videoId = $(this).parents(".video-grid-area__item").attr("data-character-id");
        if (videoId == playerId) {
            localVideo = $(this)[0];
            navigator.mediaDevices.getUserMedia(mediaStreamConstraints).then(function(stream){
                localStream = stream;
                localVideo.srcObject = localStream;
            });
        }
    });
            
    var id = `${get_url_params()["campaign"]}${playerId == null ? "" : `-${playerId}`}`;  
    peer = new Peer(id, {
        host: "video.heroes.willandbritta.com",
        debug: 2
    });
    peer.on("open", function(id){
        console.log(`Peer ID: ${id}`);
        connectPeers();
    });
    peer.on("connection", function(conn){
        connections.push(conn);
        conn.on("open", function(){
        });
        conn.on("data", function(data){
            handleMessage(data);
            drawCanvas();
        });
        console.log(`Connected to ${conn.peer}`);
    });
    peer.on("call", function(call){
        call.answer(localStream);
        call.on("stream", function(stream){
            console.log(`Inbound call from ${call.metadata.from}`);
            if (call.metadata.from == null) {
                $(".tabletop-area video")[0].srcObject = stream;
                drawings = [];
                drawCanvas();
            } else {
                $(`.video-grid-area__item[data-character-id="${call.metadata.from}"] video`)[0].srcObject = stream;
            }
        });
    });

}
function connectPeers(){
    
    if (characterId != null) {
        connections.push(connectPeer(get_url_params()["campaign"], null));
    }
    
    $(".video-grid-area__item video").each(function(){
        var videoId = $(this).parents(".video-grid-area__item").attr("data-character-id");
        if (videoId != characterId) {
            connections.push(connectPeer(`${get_url_params()["campaign"]}-${videoId}`, videoId));
        }
    });
    
}
function connectPeer(id, peerPlayerId){
    var name = player != null ? player.name : "The DM";
    var conn = peer.connect(id, {
        reliable: true
    });
    conn.on("open", function(){
        console.log(`Connected to ${conn.peer}`); 
        conn.send({
            type: "alert",
            text: `${name} has joined the party!`
        });
        var call = peer.call(conn.peer, localStream, {
            metadata: {
                from: characterId,
                to: peerPlayerId
            }
        });
        call.on("stream", function(stream){
            console.log(`Outbound call to ${call.metadata.to}`);
            if (call.metadata.to == null) {
                $(".tabletop-area video")[0].srcObject = stream;
                setTimeout(function(){
                    drawCanvas();
                }, 1000);
            } else {
                $(`.video-grid-area__item[data-character-id="${call.metadata.to}"] video`)[0].srcObject = stream;
            }
        });
        calls.push(call);
    });
    conn.on("data", function(data){
        handleMessage(data);
    });
    return conn;
}
function handleMessage(data){
    switch (data.type) {
        case "broadcast":
            $(".chat-area__chatbox  ul").append(
                `<li><b>${data.from}:</b> ${data.text}</li>`
            );
            break;
        case "alert":
            $(".chat-area__chatbox  ul").append(
                `<li><i>${data.text}</i></li>`
            );
            break;
        case "drawing":
            drawings.push(data.data);
            drawCanvas();
            break;
        case "directive":
            switch (data.directive) {
                case "eraseAll":
                    drawings = [];
                    drawCanvas();
                    break;
                case "updateHp":
                    var element = $(`.video-grid-area__item[data-character-id="${data.hero}"] progress`);
                    element.val(parseInt(element.val()) + parseInt(data.change));
                    paintProgressBar(element);
                    break;
            }
            break;
    }
    console.log(data);
}

$(window).resize(function(){
    drawCanvas();
});
$(document).on("mousedown", ".tabletop-area canvas", function(e){
    getPosition(e);
    paint = true;
    path = [];
});
$(document).on("mousemove", ".tabletop-area canvas", function(e){
    if (paint) {
        var videoContainer = $(".tabletop-area video");
        var videoStream = $(".tabletop-area video")[0].srcObject.getVideoTracks()[0];
        var aspectRatio = videoStream.getSettings().aspectRatio;
        var width = Math.min(videoContainer.width(), videoContainer.height() * aspectRatio);
        var height = width / aspectRatio;
        ctx.beginPath();
        if (erase) {
            ctx.globalCompositeOperation = "destination-out";
            ctx.lineWidth = 15;
        } else {
            ctx.globalCompositeOperation = "source-over";
            ctx.lineWidth = 5;
            ctx.lineCap = "round";
            ctx.strokeStyle = myColor;
        }
        ctx.moveTo(coord.x, coord.y);
        getPosition(e);
        ctx.lineTo(coord.x, coord.y);
        ctx.stroke();
        path.push({
            x: coord.x / width,
            y: coord.y / height
        });
    }
});
$(document).on("mouseup", function(){
    if (path.length > 0) {
        var drawing = {
            drawnBy: characterId,
            color: erase ? null : myColor,
            path: path
        };
        drawings.push(drawing);
        $.each(connections, function(i1,d1){
            d1.send({
                type: "drawing",
                data: drawing
            });
        });
    }
    paint = false;
    path = [];
});
function drawCanvas(){
    var videoContainer = $(".tabletop-area video");
    if ($(".tabletop-area video")[0].srcObject) {
        var videoStream = $(".tabletop-area video")[0].srcObject.getVideoTracks()[0];
        var aspectRatio = videoStream.getSettings().aspectRatio;
        var width = Math.min(videoContainer.width(), videoContainer.height() * aspectRatio);
        var height = width / aspectRatio;
        $(".tabletop-area canvas").css("top", (videoContainer.height() - height)/2);
        $(".tabletop-area canvas").css("left", (videoContainer.width() - width)/2);
        $(".tabletop-area canvas").css("height", height);
        $(".tabletop-area canvas").css("width", width);
        ctx.canvas.width = $(".tabletop-area canvas").width();
        ctx.canvas.height = $(".tabletop-area canvas").height();
        $.each(drawings, function(i1,d1){
            drawPath(d1);
        });
    }
}
function getPosition(event){
    coord.x = event.clientX - $(".tabletop-area canvas")[0].offsetLeft - 20; 
    coord.y = event.clientY - $(".tabletop-area canvas")[0].offsetTop - 20;
}
function drawPath(drawing){
    var videoContainer = $(".tabletop-area video");
    var videoStream = $(".tabletop-area video")[0].srcObject.getVideoTracks()[0];
    var aspectRatio = videoStream.getSettings().aspectRatio;
    var width = Math.min(videoContainer.width(), videoContainer.height() * aspectRatio);
    var height = width / aspectRatio;
    if (drawing.color == null) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = 15;
    } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.strokeStyle = drawing.color;
    }
    $.each(drawing.path, function(i1,d1){
        if (i1 > 0) {
            ctx.lineTo(d1.x * width, d1.y * height);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(d1.x * width, d1.y * height);
    });
}

$(document).on("click", ".tabletop-area__palette-dropdown .uk-badge", function(){
    myColor = $(this).css("background-color");
    UIkit.notification(`Changed color to ${myColor}`);
    UIkit.dropdown(".tabletop-area__palette-dropdown").hide();
});
$(document).on("click", ".tabletop-area__drawing-menu .fa-paint-brush", function(){
    erase = false;
    $(".tabletop-area__drawing-menu .fa-paint-brush").addClass("active");
    $(".tabletop-area__drawing-menu .fa-eraser").removeClass("active");
});
$(document).on("click", ".tabletop-area__drawing-menu .fa-eraser", function(){
    erase = true;
    $(".tabletop-area__drawing-menu .fa-eraser").addClass("active");
    $(".tabletop-area__drawing-menu .fa-paint-brush").removeClass("active");
});
$(document).on("click", ".tabletop-area__drawing-menu .fa-trash", function(){
    drawings = [];
    drawCanvas();
    $.each(connections, function(i1,d1){
        d1.send({
            type: "directive",
            directive: "eraseAll"
        });
    });
});

$(".chat-area__textbox").on("keyup", function(e){
    if (e.which == 13) {
        var text = $(this).val();
        $(this).val(""); 
        var message = {
            type: player == null && $(".chat-area__alias").val() == "" ? "alert" : "broadcast",
            from: player == null ? ($(".chat-area__alias").val() ? $(".chat-area__alias").val() : "DM") : player.name,
            text: text.trim()
        }
        handleMessage(message);
        $.each(connections, function(i1,d1){
            d1.send(message);
        });
    }
});

$(".chat-area i[data-sides]").on("click", function(){
    var name = player == null ? ($(".chat-area__alias").val() ? $(".chat-area__alias").val() : "The DM") : player.name
    var roll = Math.floor(Math.random() * $(this).attr("data-sides")) + 1;
    var message = {
        type: "alert",
        text: `${name} rolled ${roll} (d${$(this).attr("data-sides")})`
    };
    handleMessage(message);
    $.each(connections, function(i1,d1){
        d1.send(message);
    });
});

$(document).on("mouseenter", ".video-grid-area__item", function(){
    $(this).find(".video-grid-area__mute-button").show();
});
$(document).on("mouseleave", ".video-grid-area__item", function(){
    if (!$(this).find(".video-grid-area__mute-button").attr("muted")) {
        $(this).find(".video-grid-area__mute-button").hide();
    }
});
$(document).on("click", ".video-grid-area__mute-button", function(){
    if ($(this).attr("muted")) {
        $(this).removeAttr("muted");
        $(this).parents(".video-grid-area__item").find("video")[0].srcObject.getAudioTracks()[0].enabled = true;
    } else {
        $(this).attr("muted", true);
        $(this).parents(".video-grid-area__item").find("video")[0].srcObject.getAudioTracks()[0].enabled = false;
    }
});

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

function getMediaDevices(){
    
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