<?php

require_once __DIR__."/../includes/classes/open5e_connector.php";
require_once __DIR__."/../includes/classes/heroes_connector.php";

foreach ((new Open5e_Connector)->get("/spells/")->results as $spell) {
    
    $spell_schools = [
        "Abjuration" => 1,
        "Conjuration" => 2,
        "Divination" => 3,
        "Enchantment" => 4,
        "Evocation" => 5,
        "Illusion" => 6,
        "Necromancy" => 7,
        "Transmutation" => 8
    ];
    
    $classes = [
        "Barbarian" => 1,
        "Bard" => 2,
        "Cleric" => 3,
        "Druid" => 4,
        "Fighter" => 5,
        "Monk" => 6,
        "Paladin" => 7,
        "Ranger" => 8,
        "Rogue" => 9,
        "Sorcerer" => 10,
        "Warlock" => 11,
        "Wizard" => 12,
        "Artificer" => 13
    ];
    
    $spell_classes = [];
    foreach (explode(",", $spell->dnd_class) as $class) {
        $class = trim($class);
        if (isset($classes[$class])) {
            array_push($spell_classes, $classes[$class]);
        }
    }
    
    $heroes = new Heroes_Connector();
    $heroes->query(
        "INSERT INTO spell (
            name,
            description,
            higher_levels,
            `range`,
            v, s, m,
            concentration,
            ritual,
            duration,
            casting_time,
            level,
            spell_school_id
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)\n",
        [
            trim($spell->name),
            trim($spell->desc),
            trim($spell->higher_level),
            trim($spell->range),
            strpos($spell->components, "V") !== false ? 1 : 0,
            strpos($spell->components, "S") !== false ? 1 : 0,
            trim($spell->material),
            $spell->concentration == "yes" ? 1 : 0,
            $spell->ritual == "yes" ? 1 : 0,
            trim($spell->duration),
            trim($spell->casting_time),
            $spell->level_int,
            $spell_schools[$spell->school]
        ]
    );
    $spell_id = $heroes->last_insert_id();
    $heroes->query(sprintf(
        "INSERT INTO spell__class (spell_id, class_id) VALUES (%s, %s)",
        $spell_id,
        implode($spell_classes, sprintf("), (%s, ", $spell_id))
    ));
}