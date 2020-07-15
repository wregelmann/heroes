class DiceTray extends HTMLElement {
        
    connectedCallback() {
        $(this).html(
            `<table class="uk-table">
                <tr>
                    <td><i class="fas fa-dice-d4 clickable" uk-tooltip="d4" data-sides="4"></i></td>
                    <td><i class="fas fa-dice-d6 clickable" uk-tooltip="d6" data-sides="6"></i></td>
                    <td><i class="fas fa-dice-d8 clickable" uk-tooltip="d8" data-sides="8"></i></td>
                    <td><i class="fas fa-dice-d10 clickable" uk-tooltip="d10" data-sides="10"></i></td>
                    <td><i class="fas fa-dice-d12 clickable" uk-tooltip="d12" data-sides="12"></i></td>
                    <td><i class="fas fa-dice-d20 clickable" uk-tooltip="d20" data-sides="20"></i></td>
                </tr>
            </table>`
        );
    }
        
}

window.customElements.define("dice-tray", DiceTray);