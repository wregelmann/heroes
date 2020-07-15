class InitiativeTracker extends HTMLElement {
    
    connectedCallback() {
        
        let element = $(this);
        element.hide();
        element.html(
            `<ul class="uk-list uk-list-striped"></ul>
            <button class="uk-button uk-button-primary"><i class="fas fa-plus"></i> Add Combatant</button>`
        );

        element.on("click", "button", () => {
            UIkit.modal.prompt("Name:").then( (name) => {
                UIkit.modal.prompt("Max HP:").then( (hp) => {
                    element.find("ul").append(
                        `<li>
                            <span class="uk-badge clickable"></span> ${ name }
                            <health-bar max="${ hp }" value="${ hp }" temp="0" />
                        </li>`
                    );
                });
            });
        });
        
        element.on("click", ".uk-badge", (event) => {
            let listItem = $(event.target).parents("li");
            console.log(listItem);
            UIkit.modal.prompt("Initiative:").then( (val) => {
                let newElement = listItem.clone(true);
                newElement.find(".uk-badge").html(val);
                listItem.remove();
                let found = false;
                if (val !== "") {
                    element.find("li").each( (index) => {
                        let thisItem = $(element.find("li")[index]);
                        if (parseInt(newElement.find(".uk-badge").text()) > parseInt(thisItem.find(".uk-badge").text()) || !parseInt(thisItem.find(".uk-badge").text())) {
                            thisItem.before(newElement);
                            found = true;
                            return false;
                        }
                    });
                    if (!found) {
                        $(element).find("ul").append(newElement);
                    }
                }
            });
        });
        
    }
    
    addCombatant(name) {
        $(this).find("ul").append(
            `<li><span class="uk-badge clickable"></span> ${name}</li>`
        );
    }
    
}

window.customElements.define("initiative-tracker", InitiativeTracker);