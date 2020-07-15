import { selectHero, updateHero } from "/main.js";
import { converter, copyTemplate } from "/modules/common.js";

$( () => {
    $(".menu-top").append(
        `<i class="menu__dm-features-icon fas fa-flask-potion dm-visible" uk-tooltip="title: Features; pos: left;" style="display: none;"></i>
        <i class="menu__inventory-icon fas fa-sack pc-visible" uk-tooltip="title: Inventory; pos: left;" style="display: none;"></i>`
    );
});

export async function getFeatures(){
    return $.ajax({
            url: "/api/features/",
            dataType: "json"
        });
}

export async function getFeature(id) {
    return $.ajax({
            url: `/api/features/${ id }`,
            dataType: "json"
        });
}

export async function createFeature(data) {
    $.ajax({
        url: `/api/features/`,
        type: "POST",
        data: data
    });
}

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
            element.find(".dm-features-modal__feature-description").html(common.converter.makeHtml(data.description));
        }
    });
});

$(document).on("click", ".dm-features-modal .uk-modal-footer > a", () => {
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
        url: `/api/campaigns/${common.getUrlParams()["campaign"]}`,
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
                var playerCharacterId = $(this).attr("data-character-id");
                var characterName = $(this).text();
                $.ajax({
                    url: `/api/heroes/${playerCharacterId}`,
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
        success: () => {
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
        success: data => {
            $.each(data.features, function(i1,d1){
                $.ajax({
                    url: `/api/features/${d1.id}`,
                    dataType: "json",
                    global: false,
                    success: data => {
                        $(".features-modal .uk-modal-body > ul").append(
                            `<li data-feature-id="${d1.id}">
                                <a class="uk-accordion-title" href="#">${d1.name}</a>
                                <div class="uk-accordion-content">
                                    <div>${common.converter.makeHtml(data.description)}</div>
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