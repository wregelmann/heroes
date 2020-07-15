import { selectHero, updateHero } from "/main.js";
import { converter, copyTemplate } from "/modules/common.js";

$( () => {
    $(".menu-top").append(
        `<i class="menu__dm-spells-icon fas fa-fire dm-visible" uk-tooltip="title: Spells; pos: left;" style="display: none;"></i>
        <i class="menu__spellbook-icon fas fa-book-spells pc-visible" uk-tooltip="title: Inventory; pos: left;" style="display: none;"></i>`
    );
});

export async function getSpells(){
    return $.ajax({
            url: "/api/spells/",
            dataType: "json"
        });
}

export async function getSpell(id) {
    return $.ajax({
            url: `/api/spells/${ id }`,
            dataType: "json"
        });
}

export async function createSpell(data) {
    $.ajax({
        url: `/api/spells/`,
        type: "POST",
        data: data
    });
}

$(document).on("click", ".menu__dm-spells-icon", function(){
    $.ajax({
        url: `/api/spells`,
        dataType: "json",
        global: false,
        success: data => {
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
        success: data => {
            element.find(".dm-spells-modal__spell-description").html(
                `${common.converter.makeHtml(data.description)}`
            );
        }
    });
});

$(document).on("click", ".dm-spells-modal .uk-modal-footer > a", () => {
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
        success: () => {
            UIkit.notification(`Added ${element.find(".spell-add-modal__name").val()}`);
            UIkit.modal(".spell-add-modal").hide();
        }
    });
});
/*
$(document).on("click", ".dm-spells-modal li button", function(){
    var spellId = $(this).parents("li").attr("data-spell-id");
    var spellName = $(this).parents("li").find(".toggle > span").text();
    $.ajax({
        url: `/api/campaigns/${common.getUrlParams()["campaign"]}`,
        dataType: "json",
        global: false,
        success: data => {
            var newHtml = "";
            $.each(data.heroes, function(i1,d1){
                $.ajax({
                    url: `/api/heroes/${d1.id}`,
                    dataType: "json",
                    global: false,
                    async: false,
                    success: data => {
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
                    success: () => {
                        characterSelectModal.hide();
                        UIkit.notification(`Granted ${spellName} to ${characterName}`);
                    }
                });
            });
        }
    });
});*/
$(document).on("click", ".dm-spells-modal li button", (event) => {
    let spellId = $(event.target).parents("li").attr("data-spell-id");
    let spellName = $(event.target).parents("li").find(".toggle > span").text();
    let quantity;
    UIkit.modal.prompt("Quantity:").then( (n) => {
        quantity = n;
        return selectHero();
    }).then( (heroId) => {
        return updateHero(heroId, {
            add: {
                spells: [{
                    id: spellId,
                    quantity: n || 1
                }]
            }
        });
    }).then( () => {
        UIkit.notification(`Gave ${ quantity }x ${ spellName }`);
    });
});

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
        success: () => {
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
        success: data => {
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
                            success: data => {
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
                                            <div>${common.converter.makeHtml(data.description)}</div>
                                            <div>${data.higher_levels != "" ? "<br><b>At higher levels:</b>" : ""} ${common.converter.makeHtml(data.higher_levels)}</div>
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