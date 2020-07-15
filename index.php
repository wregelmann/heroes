<?php
header("Cache-Control: no-cache, must-revalidate");
?>
<!DOCTYPE html>

<head>

    <title>Welcome, Intrepid Hero!</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <link rel="icon" href="favicon.png">
    <?php foreach (array_slice(scandir("includes/css/"), 2) as $include ): ?>
    <link rel="stylesheet" href="includes/css/<?=$include?>">
    <?php endforeach ?>
    <link rel="stylesheet/less" href="main.less">
    
    <?php foreach (array_slice(scandir("includes/js/"), 2) as $include): ?>
    <script src="includes/js/<?=$include?>"></script>
    <?php endforeach ?>
    <script type="module" src="main.js" defer></script>

</head>

<body>
    
    <div class="container">
        <div class="tabletop-area uk-card uk-card-default">
            <div class="tabletop-area__video-container">
                <video autoplay playsinline></video>
                <canvas></canvas>
                <nav class="tabletop-area__drawing-menu uk-position-top-center">
                    <i class="fas fa-palette"></i>
                    <div class="tabletop-area__palette-dropdown" uk-dropdown="pos: bottom-center; animation: uk-animation-slide-top-small; offset: 20;">
                        <div class="uk-child-width-1-3" uk-grid>
                            <div><span class="uk-badge clickable" style="background: red"></span></div>
                            <div><span class="uk-badge clickable" style="background: gold;"></span></div>
                            <div><span class="uk-badge clickable" style="background: greenyellow"></span></div>
                            <div><span class="uk-badge clickable"></span></div>
                            <div><span class="uk-badge clickable" style="background: orchid"></span></div>
                            <div><span class="uk-badge clickable" style="background: white"></span></div>
                        </div>
                    </div>
                    <i class="fas fa-paint-brush active"></i>
                    <i class="fas fa-eraser"></i>
                    <i class="fas fa-trash dm-visible" style="display: none;"></i>
                </nav>
            </div>
            <initiative-tracker />
        </div>
        <div class="chat-area uk-card uk-card-default">
            <div>
                <div class="chat-area__chatbox"><ul class="uk-list uk-list-divider"></ul></div>
                <dice-tray></dice-tray>
                <input class="chat-area__alias dm-visible uk-input" type="text" placeholder="Alias" style="display: none;">
                <textarea class="chat-area__textbox uk-textarea" placeholder="Say something..."></textarea>
            </div>
        </div>
        <div class="video-grid-area"></div>
        <nav class="menu">
            
            <div class="menu-top">   
                <i class="menu__dm-features-icon fas fa-fist-raised dm-visible" uk-tooltip="title: Features; pos: left;" style="display: none;"></i>
                <i class="menu__dm-monsters-icon fas fa-skull dm-visible" uk-tooltip="title: Monsters; pos: left;" style="display: none;"></i>
                <i class="menu__dm-initiative-icon fas fa-repeat-1 dm-visible" uk-tooltip="title: Initiative; pos: left;" style="display: none;"></i>
                <i class="menu__character-icon fas fa-user-circle pc-visible" uk-tooltip="title: Character; pos: left;" style="display: none;"></i>
                <i class="menu__features-icon fas fa-fist-raised pc-visible" uk-tooltip="title: Features; pos: left;" style="display: none;"></i>
            </div>
            
            <span class="spacer"></span>    
            
            <div class="menu-bottom">
                <i class="menu__dm-music-icon fas fa-music dm-visible" uk-tooltip="title: Music; pos: left;" style="display: none;"></i>
                <i class="menu__settings-icon fas fa-cog pc-visible dm-visible" uk-tooltip="title: Settings; pos: left;" style="display: none;"></i>
            </div>
            
        </nav>
    </div>
           
    <div class="campaign-code-input-modal" uk-modal="bg-close: false; esc-close: false;">
        <div class="uk-modal-dialog">
            <div class="uk-modal-header">
                <h3 class="uk-modal-title">Welcome, Intrepid Hero!</h3>
            </div>
            <div class="uk-modal-body">
                <input class="uk-input" type="text" placeholder="Campaign code...">
            </div>
            <div class="uk-modal-footer">
                <button class="uk-button uk-button-primary uk-align-right">OK</button>
            </div>
        </div>
    </div>
    
    <div class="player-select-modal" uk-modal="bg-close: false; esc-close: false;">
        <div class="uk-modal-dialog">
            <div class="uk-modal-header">
                <h3 class="uk-modal-title">Who goes there?</h3>
            </div>
            <div class="uk-modal-body">
                <ul class="uk-list uk-list-divider"></ul>
            </div>
        </div>
    </div>
    
    <div class="character-detail-modal" uk-modal>
        <div class="uk-modal-dialog">
            <div class="uk-modal-header">
                <h3 class="character-detail-modal__name uk-modal-title"></h3>
                <span class="character-detail-modal__class"></span>
                <health-bar value="0" max="0" />
            </div>
            <div class="uk-modal-body">
                <div><b>Armor Class:</b> <span class="character-detail-modal__ac"></span></div>
                <div><b>Speed:</b> <span class="character-detail-modal__speed"></span></div>
                <table class="character-detail-modal__abilities uk-table uk-table-divider uk-table-justify">
                    <thead>
                        <tr><th>STR</th><th>DEX</th><th>CON</th><th>INT</th><th>WIS</th><th>CHA</th></tr>
                    </thead>
                    <tbody>
                        <tr><td></td><td></td><td></td><td></td><td></td><td></td></tr>
                    </tbody>
                </table>
                <div><b>Skills:</b> <ul class="character-detail-modal__skills uk-list uk-list-divider"></ul></div>
                <b>Proficiencies:</b>
                <div class="character-detail-modal__proficiencies"></div>
            </div>
            <div class="uk-modal-footer">
                <button class="character-detail-modal__spells-button uk-button uk-button-default">Attacks</button>
                <button class="character-detail-modal__spells-button uk-button uk-button-default">Spells</button>
                <button class="character-detail-modal__inventory-button uk-button uk-button-default">Inventory</button>
                <button class="character-detail-modal__features-button uk-button uk-button-default">Features</button>
            </div>
        </div>
    </div>
    
    <div class="spellbook-modal" uk-modal>
        <div class="uk-modal-dialog"></div>
    </div>
    
    <div class="inventory-modal" uk-modal>
        <div class="uk-modal-dialog">
            <div class="uk-modal-header">
                <h3 class="uk-modal-title">Inventory</h3>
            </div>
            <div class="uk-modal-body">
                <ul uk-accordion></ul>
            </div>
        </div>
    </div>
    
    <div class="features-modal" uk-modal>
        <div class="uk-modal-dialog">
            <div class="uk-modal-header">
                <h3 class="uk-modal-title">Features</h3>
            </div>
            <div class="uk-modal-body">
                <ul uk-accordion></ul>
            </div>
        </div>
    </div>
    
    <div class="spell-add-modal" uk-modal>
        <div class="uk-modal-dialog">
            <div class="uk-modal-header">
                <h3 class="uk-modal-title">New Spell</h3>
            </div>
            <div class="uk-modal-body">
                
            </div>
            <div class="uk-modal-footer">
                <button class="uk-button uk-button-primary uk-align-right">Submit</button>
            </div>
        </div>
    </div>
    
    <div class="item-add-modal" uk-modal>
        <div class="uk-modal-dialog">
            <div class="uk-modal-header">
                <h3 class="uk-modal-title">New Item</h3>
            </div>
            <div class="uk-modal-body">
                <input class="item-add-modal__name uk-input uk-margin-bottom" type="text" placeholder="Name">
                <select class="item-add-modal__type uk-select uk-margin-bottom">
                    <option value="1">Item</option>
                    <option value="2">Armor</option>
                    <option value="3">Weapon</option>
                </select>
                <textarea class="item-add-modal__description uk-textarea" placeholder="Description"></textarea>
            </div>
            <div class="uk-modal-footer">
                <button class="uk-button uk-button-primary uk-align-right">Submit</button>
            </div>
        </div>
    </div>
    
    <div class="dm-features-modal" uk-modal>
        <div class="uk-modal-dialog">
            <div class="uk-modal-header">
                <input class="filter uk-input" type="text" placeholder="Filter...">
            </div>
            <div class="uk-modal-body">
                <ul class="uk-list uk-list-striped" uk-accordion="toggle: > .toggle"></ul>
            </div>
            <div class="uk-modal-footer">
                <a><i class="fas fa-plus"></i> Add Feature</a>
            </div>
        </div>
    </div>
    <div class="feature-add-modal" uk-modal>
        <div class="uk-modal-dialog">
            <div class="uk-modal-header">
                <h3 class="uk-modal-title">New Feature</h3>
            </div>
            <div class="uk-modal-body">
                <input class="feature-add-modal__name uk-input uk-margin-bottom" type="text" placeholder="Name">
                <textarea class="feature-add-modal__description uk-textarea" placeholder="Description"></textarea>
            </div>
            <div class="uk-modal-footer">
                <button class="uk-button uk-button-primary uk-align-right">Submit</button>
            </div>
        </div>
    </div>
    
    <div class="dm-monsters-modal" uk-modal>
        <div class="uk-modal-dialog">
            <div class="uk-modal-header">
                <input class="filter uk-input" type="text" placeholder="Filter...">
            </div>
            <div class="uk-modal-body">
                <ul class="uk-list uk-list-striped" uk-accordion="toggle: > .toggle"></ul>
            </div>
            <div class="uk-modal-footer">
                <a><i class="fas fa-plus"></i> Add Monster</a>
            </div>
        </div>
    </div>
    <div class="monster-add-modal" uk-modal>
        <div class="uk-modal-dialog">
            <div class="uk-modal-header">
                <h3 class="uk-modal-title">New Monster</h3>
            </div>
            <div class="uk-modal-body">
                <input class="monster-add-modal__name uk-input uk-margin-bottom" type="text" placeholder="Name">
                <table class="uk-margin-bottom" style="width: 100%;">
                    <tbody>
                        <tr>
                            <td class="uk-width-1-4"><input class="monster-add-modal__cr uk-input" type="text" placeholder="CR"></td>
                            <td><input class="monster-add-modal__type uk-input" type="text" placeholder="Type"></td>
                        </tr>
                    </tbody>
                <table>
                    <tbody>
                        <tr>
                            <td><input class="monster-add-modal__hp uk-input" type="text" placeholder="HP"></td>
                            <td><input class="monster-add-modal__speed uk-input" type="text" placeholder="Speed"></td>
                            <td><input class="monster-add-modal__ac uk-input" type="text" placeholder="AC"></td>
                        </tr>
                    </tbody>
                </table>
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
                            <td><input class="monster-add-modal__str uk-input" type="number"></td>
                            <td><input class="monster-add-modal__dex uk-input" type="number"></td>
                            <td><input class="monster-add-modal__con uk-input" type="number"></td>
                            <td><input class="monster-add-modal__int uk-input" type="number"></td>
                            <td><input class="monster-add-modal__wis uk-input" type="number"></td>
                            <td><input class="monster-add-modal__cha uk-input" type="number"></td>
                        </tr>
                    </tbody>
                </table>
                <textarea class="monster-add-modal__features uk-textarea uk-margin-bottom" placeholder="Features"></textarea>
                <textarea class="monster-add-modal__actions uk-textarea" placeholder="Actions"></textarea>
            </div>
            <div class="uk-modal-footer">
                <button class="uk-button uk-button-primary uk-align-right">Submit</button>
            </div>
        </div>
    </div>
    
    <div class="dm-music-modal" uk-modal>
        <div class="uk-modal-dialog">
            <div class="uk-modal-body">
                <ul class="uk-list uk-list-striped"></ul>
            </div>
        </div>
    </div>

</body>
            
<template class="list-modal-template">
    <div class="uk-modal-header">
        <input class="filter uk-input" type="text" placeholder="Filter...">
    </div>
    <div class="uk-modal-body">
    </div>
    <div class="uk-modal-footer">
        <a><i class="fas fa-plus"></i> Add <span data-value="type"></span></a>
    </div>
</template>
