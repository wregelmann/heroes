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

$(document).on("click", ".menu__dm-features-icon", () => {
    getFeatures().then( (features) => {
        let dmFeaturesModal = UIkit.modal.dialog(copyTemplate(".list-modal-template").html());
        $(dmFeaturesModal.$el).addClass("list-modal dm-features-modal");
        $(dmFeaturesModal.$el).find(".uk-modal-body").html(`<ul class="uk-list uk-list-striped" uk-accordion="toggle: > .toggle"></ul>`);
        $(dmFeaturesModal.$el).find(`[data-value="type"]`).html("Feature");
        $(".dm-features-modal ul.uk-list").html(null);
            features.forEach( (feature) => {
                $(dmFeaturesModal.$el).find("ul.uk-list").append(
                    `<li class="clickable">
                        <div class="toggle" data-feature-id="${ feature.id }"><span>${ feature.name }</span> <i class="uk-align-right">${ feature.type }</i></div>
                        <div class="uk-accordion-content">
                            <div class="dm-features-modal__feature-description"></div>
                            <button class="uk-button uk-button-primary">Give</button>
                        </div>
                    </li>`
                );
            });
            UIkit.modal(".dm-features-modal").show();
    });
});

$(document).on("click", ".dm-features-modal .toggle", (event) => {
    let id = $(event.target).attr("data-feature-id");
    getFeature(id).then( (feature) => {
        $(event.target).parents("li").find(".dm-features-modal__feature-description").html(converter.makeHtml(feature.description));
    });
});

$(document).on("click", ".dm-features-modal .uk-modal-footer > a", () => {
    UIkit.modal(".feature-add-modal").show();
});

$(document).on("click", ".feature-add-modal button", (event) => {
    var element = $(event.target).parents(".uk-modal-dialog").find(".uk-modal-body");
    createFeature({
        name: element.find(".feature-add-modal__name").val(),
        type: element.find(".feature-add-modal__type option:selected").val(),
        description: element.find(".feature-add-modal__description").val()
    }).then( () => {
        UIkit.notification(`Added ${element.find(".feature-add-modal__name").val()}`);
        UIkit.modal(".feature-add-modal").hide();
    });
});

$(document).on("click", ".dm-features-modal li button", (event) => {
    let featureId = $(event.target).parents("li").attr("data-feature-id");
    let featureName = $(event.target).parents("li").find(".toggle > span").text();
    let quantity;
    UIkit.modal.prompt("Quantity:").then( (n) => {
        quantity = n;
        return selectHero();
    }).then( (heroId) => {
        return updateHero(heroId, {
            add: {
                features: [{
                    id: featureId,
                    quantity: n || 1
                }]
            }
        });
    }).then( () => {
        UIkit.notification(`Gave ${ quantity }x ${ featureName }`);
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