import { selectHero, updateHero } from "/main.js";
import { converter, copyTemplate } from "/modules/common.js";

$( () => {
    $(".menu-top").append(
        `<i class="menu__dm-items-icon fas fa-flask-potion dm-visible" uk-tooltip="title: Items; pos: left;" style="display: none;"></i>
        <i class="menu__inventory-icon fas fa-sack pc-visible" uk-tooltip="title: Inventory; pos: left;" style="display: none;"></i>`
    );
});

export async function getItems(){
    return $.ajax({
            url: "/api/items/",
            dataType: "json"
        });
}

export async function getItem(id) {
    return $.ajax({
            url: `/api/items/${ id }`,
            dataType: "json"
        });
}

export async function createItem(data) {
    $.ajax({
        url: `/api/items/`,
        type: "POST",
        data: data
    });
}

$(document).on("click", ".menu__dm-items-icon", () => {
    getItems().then( (items) => {
        let dmItemsModal = UIkit.modal.dialog(copyTemplate(".list-modal-template").html());
        $(dmItemsModal.$el).addClass("list-modal dm-items-modal");
        $(dmItemsModal.$el).find(".uk-modal-body").html(`<ul class="uk-list uk-list-striped" uk-accordion="toggle: > .toggle"></ul>`);
        $(dmItemsModal.$el).find(`[data-value="type"]`).html("Item");
        $(".dm-items-modal ul.uk-list").html(null);
        for (let item of items) {
            $(dmItemsModal.$el).find("ul.uk-list").append(
                `<li class="clickable">
                    <div class="toggle" data-item-id="${ item.id }"><span>${ item.name }</span> <i class="uk-align-right">${ item.type }</i></div>
                    <div class="uk-accordion-content">
                        <div class="dm-items-modal__item-description"></div>
                        <button class="uk-button uk-button-primary">Give</button>
                    </div>
                </li>`
            );
        }
        UIkit.modal(".dm-items-modal").show();
    });
});

$(document).on("click", ".dm-items-modal .toggle", (event) => {
    let id = $(event.target).attr("data-item-id");
    getItem(id).then( (item) => {
        $(event.target).parents("li").find(".dm-items-modal__item-description").html(converter.makeHtml(item.description));
    });
});

$(document).on("click", ".dm-items-modal .uk-modal-footer > a", () => {
    UIkit.modal(".item-add-modal").show();
});

$(document).on("click", ".item-add-modal button", (event) => {
    var element = $(event.target).parents(".uk-modal-dialog").find(".uk-modal-body");
    createItem({
        name: element.find(".item-add-modal__name").val(),
        type: element.find(".item-add-modal__type option:selected").val(),
        description: element.find(".item-add-modal__description").val()
    }).then( () => {
        UIkit.notification(`Added ${element.find(".item-add-modal__name").val()}`);
        UIkit.modal(".item-add-modal").hide();
    });
});

$(document).on("click", ".dm-items-modal li button", (event) => {
    let itemId = $(event.target).parents("li").attr("data-item-id");
    let itemName = $(event.target).parents("li").find(".toggle > span").text();
    let quantity;
    UIkit.modal.prompt("Quantity:").then( (n) => {
        quantity = n;
        return selectHero();
    }).then( (heroId) => {
        return updateHero(heroId, {
            add: {
                items: [{
                    id: itemId,
                    quantity: n || 1
                }]
            }
        });
    }).then( () => {
        UIkit.notification(`Gave ${ quantity }x ${ itemName }`);
    });
});

$(document).on("click", ".menu__inventory-icon", function(){
    populateInventoryModal(characterId);
});
$(document).on("click", ".character-detail-modal__inventory-button", function(){
    populateInventoryModal($(this).parents(".character-detail-modal").attr("data-character-id"));
});
$(document).on("click", ".inventory-modal .uk-accordion-content button", function(){
    var heroId = $(this).parents(".inventory-modal").attr("data-hero-id");
    var itemId = $(this).parents("li").attr("data-item-id");
    UIkit.modal.prompt("Quantity:").then( (n) => {
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
            success: () => {
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
        success: data => {
            $.each(data.inventory, function(i1,d1){
                $.ajax({
                    url: `/api/items/${d1.id}`,
                    dataType: "json",
                    global: false,
                    success: data => {
                        $(".inventory-modal .uk-modal-body > ul").append(
                            `<li data-item-id="${d1.id}">
                                <a class="uk-accordion-title" href="#">${d1.name} (${d1.quantity})</a>
                                <div class="uk-accordion-content">
                                    <div>${common.converter.makeHtml(data.description)}</div>
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