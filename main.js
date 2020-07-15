import * as common from "/modules/common.js";
import * as rtc from "/modules/rtc.js";
import * as paint from "/modules/paint.js";
import * as items from "/modules/items.js";
import * as spells from "/modules/spells.js";
import "/modules/initiative-tracker.js";
import "/modules/health-bar.js";
import "/modules/dice-tray.js";

export let 
    campaignCode = null,
    characterId = null,
    advancement = [],
    localVideo;
export const debug = true;

common.defineKeyboardShortcuts([
    {
        type: "sequence",
        keys: [38,38,40,40,37,39,37,39,66,65,13],
        do: () => {
            if ($(".player-select-modal").is(":visible")) {
                UIkit.notification("God mode activated");
                UIkit.modal(".player-select-modal").hide();
                join(null);
            }
        }
    }
]);

$( () => {

    selectCampaign().then( (code) => {
        campaignCode = code;
        return prepopulate(campaignCode);
    }).then( () => {
        return debug ? null : selectHero();
    }).then( (heroId) => {
        join(heroId);
    });
    
});

$(document).on("click", ".menu__settings-icon", () => {
    rtc.devicePrompt();
});

export async function getCampaign(code){
    return $.ajax({
        url: `/api/campaigns/${code}`,
        dataType: "json"
    });
}

export async function getHeroes(){
    return $.ajax({
        url: `/api/heroes/`,
        dataType: "json"
    });
}

export async function getHero(id){
    return $.ajax({
        url: `/api/heroes/${ id }`,
        dataType: "json"
    });
}

export async function updateHero(heroId, data){
    return $.ajax({
        url: `/api/heroes/${ heroId }`,
        type: "PATCH",
        dataType: "json",
        data: data
    });
}

export async function selectHero(){
    return new Promise( (resolve, reject) => {
        getCampaign(campaignCode).then( (campaign) => {
            let characterSelectModal = UIkit.modal.dialog(
                `<div class="uk-modal-body">
                    <ul class="uk-list uk-list-striped"></ul>
                </div>`
            );
            for (let hero of campaign.heroes) {
                $(characterSelectModal.$el).find("ul").append(
                    `<li class="clickable" data-character-id="${ hero.id }">${ hero.name }</li>`
                );
            }
            $(characterSelectModal.$el).on("click", "li", (event) => {
                resolve($(event.target).attr("data-character-id"));
                characterSelectModal.hide();
            });
        });
    });
}

async function selectCampaign(){
    
    return new Promise( (resolve, reject) => {
        
        if (common.getUrlParams()["campaign"]) {
            
            resolve(common.getUrlParams()["campaign"]);
            
        } else {
        
            UIkit.modal(".campaign-code-input-modal").show();
            $(document).on("click", ".campaign-code-input-modal .uk-button", () => {
                submitCampaignCode().then( (code) => { resolve(code) } );
            });
            $(document).on("keydown", ".campaign-code-input-modal .uk-input", (event) => {
                if (event.which == 13) {
                    submitCampaignCode().then( (code) => { resolve(code) } );
                }
            });
        
        }
        
    });
    
    async function submitCampaignCode(){
        var campaignCode = $(".campaign-code-input-modal .uk-input").val();
        return new Promise( (resolve) => {
            $.ajax({
                url: `/api/campaigns/${campaignCode}`,
                dataType: "json",
                success: () => {
                    UIkit.modal(".campaign-code-input-modal").hide();
                    resolve(campaignCode);
                },
                error: () => {
                    $(".campaign-code-input-modal .uk-input").addClass("uk-animation-shake");
                    $(".campaign-code-input-modal .uk-input").one("animationend", () => {
                        $(".campaign-code-input-modal .uk-input").removeClass("uk-animation-shake");
                    });
                }
            });
        });
    }
    
}

function prepopulate(campaignCode){
    
    window.history.pushState(null, null, `?campaign=${campaignCode}`);
    
    paint.setCanvas($(".tabletop-area canvas")[0]);
    
    $.ajax({
        url: `/api/advancement`,
        dataType: "json",
        success: (data) => {
            for (let level of data) {
                advancement.push(level.xp);
            };
        }
    });
    
    getCampaign(campaignCode).then( (campaign) => {
        campaign.heroes.forEach( (hero) => {
            $(".video-grid-area").append(
                `<div class="video-grid-area__item" data-character-id="${hero.id}">
                    <div class="uk-card uk-card-default">
                        <video autoplay playsinline></video>
                        <span class="uk-position-bottom-center">${hero.name}</span>
                        <div class="video-grid-area__mute-button uk-position-center clickable"><i class="fas fa-volume-slash uk-position-center"></i></div>
                    </div>
                    <health-bar value="${hero.hp}" max="${hero.hp_max}" temp="${hero.hp_temp}" />
                </div>`        
            );
            $("initiative-tracker")[0].addCombatant(hero.name);
        });
    }).catch( () => {
        window.location.href = `error.php?code=404`;
    });  

}

$(document).on("click", ".menu__dm-initiative-icon", () => {
    if ($("initiative-tracker").css("display") == "none") {
        $("initiative-tracker").css("display", "flex");
    } else {
        $("initiative-tracker").css("display", "none");
    }
    drawCanvas();
});

$(document).on("click", ".menu__character-icon", () => {
       populateCharacterDetailModal(characterId);
});

function populateCharacterDetailModal(thisCharacterId){
    $.ajax({
        url: `/api/heroes/${thisCharacterId}`,
        dataType: "json",
        global: false,
        success: data => {
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
    let mod = Math.floor((score - 10)/2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
}


$(document).on("click", ".menu__dm-monsters-icon", function(){
    $.ajax({
        url: `/api/monsters`,
        dataType: "json",
        global: false,
        success: data => {
            $(".dm-monsters-modal ul.uk-list").html(null);
            $.each(data, function(i1,d1){
                $(".dm-monsters-modal ul.uk-list").append(
                    `<li class="clickable" data-monster-id="${d1.id}">
                        <div class="toggle"><i class="far fa-star"></i> <span>${d1.name}</span> <i class="uk-align-right">CR ${d1.cr}</i></div>
                        <div class="uk-accordion-content">
                        </div>
                    </li>`
                );
            });
            UIkit.modal(".dm-monsters-modal").show();
        }
    });
});
$(document).on("click", ".dm-monsters-modal li[data-monster-id]", function(){
    var id = $(this).attr("data-monster-id");
    var element = $(this);
    $.ajax({
        url: `/api/monsters/${id}`,
        dataType: "json",
        global: false,
        success: data => {
            element.find(".uk-accordion-content").html(
                `<i>${data.type}</i><br><br>
                <b>Armor class:</b> ${data.ac}<br>
                <b>Hit Points:</b> ${data.hp}<br>
                <b>Speed:</b> ${data.speed}<br>
                <table class="uk-table uk-table-divider">
                    <thead>
                        <tr>
                            <th>STR</th>
                            <th>DEX</th>
                            <th>CON</th>
                            <th>INT</th>
                            <th>WIS</th>
                            <th>CHA</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${data.str} (${abilityModifier(data.str)})</td>
                            <td>${data.dex} (${abilityModifier(data.dex)})</td>
                            <td>${data.con} (${abilityModifier(data.con)})</td>
                            <td>${data.int} (${abilityModifier(data.int)})</td>
                            <td>${data.wis} (${abilityModifier(data.wis)})</td>
                            <td>${data.cha} (${abilityModifier(data.cha)})</td>
                        </tr>
                    </tbody>
                </table>
                ${common.converter.makeHtml(data.features)}<br>
                <b>Actions</b><hr>${common.converter.makeHtml(data.actions)}`
            );
        }
    });
});

$(document).on("click", ".dm-monsters-modal .uk-modal-footer > a", function(){
    UIkit.modal(".monster-add-modal").show();
});
$(document).on("click", ".monster-add-modal button", function(){
    var element = $(this).parents(".uk-modal-dialog").find(".uk-modal-body");
    $.ajax({
        url: `/api/monsters`,
        type: "POST",
        global: false,
        data: {
            name: element.find(".monster-add-modal__name").val(),
            type: element.find(".monster-add-modal__type").val(),
            hp: element.find(".monster-add-modal__hp").val(),
            speed: element.find(".monster-add-modal__speed").val(),
            cr: element.find(".monster-add-modal__cr").val(),
            ac: element.find(".monster-add-modal__ac").val(),
            str: element.find(".monster-add-modal__str").val(),
            dex: element.find(".monster-add-modal__dex").val(),
            con: element.find(".monster-add-modal__con").val(),
            int: element.find(".monster-add-modal__int").val(),
            wis: element.find(".monster-add-modal__wis").val(),
            cha: element.find(".monster-add-modal__cha").val(),
            features: element.find(".monster-add-modal__features").val(),
            actions: element.find(".monster-add-modal__actions").val()
        },
        success: function(){
            UIkit.notification(`Added ${element.find(".monster-add-modal__name").val()}`);
            UIkit.modal(".monster-add-modal").hide();
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
function join(playerCharacterId){

    console.log(playerCharacterId);

    if (playerCharacterId == null) {

        localVideo = $(".tabletop-area video")[0];
        $(".dm-visible").show();
        $(".video-grid-area__item span").addClass("clickable");
        $(document).on("click", ".video-grid-area__item span", () => {
            populateCharacterDetailModal($(this).parents(".video-grid-area__item").attr("data-character-id"));
        });

    } else {

        characterId = playerCharacterId;
        localVideo = $(`.video-grid-area__item[data-character-id="${ characterId }"]`)[0];
        $(".pc-visible").show();

    }
    
    rtc.devicePrompt().finally( () => {
        
        localVideo.srcObject = rtc.getLocalStream();
        localVideo.muted = true;
        
        let peerId = `${common.getUrlParams()["campaign"]}${playerCharacterId == null ? "" : `-${playerCharacterId}`}`;
        rtc.createPeer(peerId);
        
    });

}
function connectPeers(){
        
    if (characterId != null) {
        $.each(connections, function(i1,d1){
            if (d1.peer == common.getUrlParams()["campaign"]) {
                connections.splice(i1,1);
            }
        });
        connections.push(connectPeer(common.getUrlParams()["campaign"], null));
    }
    
    $(".video-grid-area__item video").each(function(){
        var videoId = $(this).parents(".video-grid-area__item").attr("data-character-id");
        if (videoId != characterId) {
            $.each(connections, function(i1,d1){
                if (d1.peer == `${common.getUrlParams()["campaign"]}-${videoId}`) {
                    connections.splice(i1,1);
                }
            });
            connections.push(connectPeer(`${common.getUrlParams()["campaign"]}-${videoId}`, videoId));
        }
    });
    
}
function connectPeer(id, peerPlayerId){
    var name = player != null ? player.name : "The DM";
    var conn = peer.connect(id);
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
    
    console.log(data);
    
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
            paint.addDrawing(data.data);
            drawCanvas();
            break;
        
        case "directive":
            switch (data.directive) {
                case "eraseAll":
                    paint.clearCanvas();
                    break;
                case "updateHp":
                    var element = $(`.video-grid-area__item[data-character-id="${data.hero}"] progress`);
                    element.val(parseInt(element.val()) + parseInt(data.change));
                    paintProgressBar(element);
                    break;
                case "reconnect":
                    connections = [];
                    connectPeers();
                    break;
            }
            break;
    
    }
    
}

$(window).resize(function(){
    if ($(this).width() < 800) {
        $(".container").css("grid-template-areas", `"t" "c"`);
        $(".video-grid-area").hide();
        $(".container").css("grid-template-columns", "auto");
        $(".container").css("grid-template-rows", "1fr 1fr");
    } else {
        $(".container").css("grid-template-areas", `"t c" "v c"`);
        $(".video-grid-area").show();
        $(".container").css("grid-template-columns", "minmax(auto, 1200px) minmax(360px, auto) !important");
        $(".container").css("grid-template-rows", "minmax(auto, 720px) minmax(0,1fr)");
    }
    drawCanvas();
});

$(document).on("mousedown", ".tabletop-area canvas", function(event){
    var canvas = $(this)[0];
    var position = {
        x: event.clientX,
        y: event.clientY
    };
    paint.start(canvas, position).then( (line) => {
        console.log({
            drawnBy: characterId,
            ...line
        });
    });
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

$(document).on("click", ".tabletop-area__palette-dropdown .uk-badge", function(){
    paint.setDraw($(this).css("background-color"));
    UIkit.dropdown(".tabletop-area__palette-dropdown").hide();
});
$(document).on("click", ".tabletop-area__drawing-menu .fa-paint-brush", function(){
    paint.setDraw();
    $(".tabletop-area__drawing-menu .fa-paint-brush").addClass("active");
    $(".tabletop-area__drawing-menu .fa-eraser").removeClass("active");
});
$(document).on("click", ".tabletop-area__drawing-menu .fa-eraser", function(){
    paint.setErase();
    $(".tabletop-area__drawing-menu .fa-eraser").addClass("active");
    $(".tabletop-area__drawing-menu .fa-paint-brush").removeClass("active");
});
$(document).on("click", ".tabletop-area__drawing-menu .fa-trash", function(){
    paint.clearCanvas();
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
            console.log(d1);
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