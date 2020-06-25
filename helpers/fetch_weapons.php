<?php

require_once __DIR__."/../includes/classes/open5e_connector.php";
require_once __DIR__."/../includes/classes/heroes_connector.php";

foreach ((new Open5e_Connector)->get("/weapons/")->results as $weapon) {
            
    $versatile = false;
    
    $heroes = new Heroes_Connector();
    $heroes->query(
        "INSERT INTO item (name, description, type_id, cost) VALUES (?, ?, 3, ?)",
        [
            $weapon->name,
            sprintf(
                "*%s*\n\n**Weight:** %s\n**Damage:** %s %s\n**Properties:** %s",
                rtrim($weapon->category, "s"),
                $weapon->weight,
                $weapon->damage_dice, $weapon->damage_type,
                implode(", ", $weapon->properties)
            ),
            $weapon->cost
        ]
    );
    $item_id = $heroes->last_insert_id();
    
    foreach ($weapon->properties as $property) {
        if (preg_match("/^versatile \((.+)\)$/", $property, $matches)) {
            $versatile = true;
            $heroes->query(
                "INSERT INTO attack (name, damage) VALUES (?, ?)",
                [
                    sprintf("%s (2H)", $weapon->name),
                    sprintf("%s %s", $matches[1], $weapon->damage_type)
                ]
            );
            $attack_id = $heroes->last_insert_id();
            $heroes->query(
                "INSERT INTO item__attack (item_id, attack_id) VALUES (?, ?)",
                [$item_id, $attack_id]
            );
        }
    }
    
    $heroes->query(
        "INSERT INTO attack (name, damage) VALUES (?, ?)",
        [
            sprintf("%s%s", $weapon->name, $versatile ? " (1H)" : ""),
            sprintf("%s %s", $weapon->damage_dice, $weapon->damage_type)
        ]
    );
    $attack_id = $heroes->last_insert_id();
    $heroes->query(
        "INSERT INTO item__attack (item_id, attack_id) VALUES (?, ?)",
        [$item_id, $attack_id]
    );
}