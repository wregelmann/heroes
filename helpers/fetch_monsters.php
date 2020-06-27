<?php

require_once __DIR__."/../includes/classes/open5e_connector.php";
require_once __DIR__."/../includes/classes/heroes_connector.php";

foreach ((new Open5e_Connector)->get("/monsters/")->results as $i=>$monster) {
        
    
    $speed = [];
    foreach ((array)$monster->speed as $type=>$distance) {
        array_push($speed, sprintf("%s %s ft.", $type, $distance));
    }
    
    $features = [];
    $saves = [];
    if ($monster->strength_save) {
        array_push($saves, sprintf("str %s%s", $monster->strength_save > 0 ? "+" : "", $monster->strength_save));
    }
    if ($monster->dexterity_save) {
        array_push($saves, sprintf("dex %s%s", $monster->dexterity_save > 0 ? "+" : "", $monster->dexterity_save));
    }
    if ($monster->constitution_save) {
        array_push($saves, sprintf("con %s%s", $monster->constitution_save > 0 ? "+" : "", $monster->constitution_save));
    }
    if ($monster->intelligence_save) {
        array_push($saves, sprintf("int %s%s", $monster->intelligence_save > 0 ? "+" : "", $monster->intelligence_save));
    }
    if ($monster->wisdom_save) {
        array_push($saves, sprintf("wis %s%s", $monster->wisdom_save > 0 ? "+" : "", $monster->wisdom_save));
    }
    if ($monster->charisma_save) {
        array_push($saves, sprintf("cha %s%s", $monster->charisma_save > 0 ? "+" : "", $monster->charisma_save));
    }
    if (count($saves)) {
        array_push($features, sprintf("**Saving throws:** %s", implode(", ", $saves)));
    }
    $skills = [];
    foreach ((array)$monster->skills as $skill=>$score) {
        array_push($skills, sprintf("%s %s%s", $skill, $score > 0 ? "+" : "", $score));
    }
    if (count($skills)) {
        array_push($features, sprintf("**Skills:** %s", implode(", ", $skills)));
    }
    if ($monster->damage_vulnerabilities) {
        array_push($features, sprintf("**Damage vulnerabilities:** %s", $monster->damage_vulnerabilities));
    }
    if ($monster->damage_resistances) {
        array_push($features, sprintf("**Damage resistances:** %s", $monster->damage_resistances));
    }
    if ($monster->damage_immunities) {
        array_push($features, sprintf("**Damage immunities:** %s", $monster->damage_immunities));
    }
    if ($monster->condition_immunities) {
        array_push($features, sprintf("**Condition immunities:** %s", $monster->condition_immunities));
    }
    if ($monster->senses) {
        array_push($features, sprintf("**Senses:** %s", $monster->senses));
    }
    if ($monster->languages) {
        array_push($features, sprintf("**Languages:** %s", $monster->languages));
    }
    if ($monster->special_abilities != "") {
        foreach ((array)$monster->special_abilities as $ability) {
            array_push($features, sprintf("\n**%s**. %s", $ability->name, $ability->desc));
        }
    }
    
    $actions = [];
    foreach ((array)$monster->actions as $action) {
        array_push($actions, sprintf("**%s**. %s\n", $action->name, $action->desc));
    }
    if ($monster->reactions !== "") {
        array_push($actions, "**Reactions**\n\n---\n");
        foreach ((array)$monster->reactions as $reaction) {
            array_push($actions, sprintf("**%s**. %s\n", $reaction->name, $reaction->desc));
        }
    }
    if ($monster->legendary_actions != "") {
        array_push($actions, sprintf("**Legendary actions**\n\n---\n\n%s\n", $monster->legendary_desc));
        foreach ((array)$monster->legendary_actions as $legendary_action) {
            array_push($actions, sprintf("**%s**. %s\n", $legendary_action->name, $legendary_action->desc));
        }
    }
    
    $heroes = new Heroes_Connector();
    $heroes->query(
        "INSERT INTO monster (
            name,
            type,
            ac,
            hp,
            speed,
            cr,
            str,
            dex,
            con,
            `int`,
            wis,
            cha,
            features,
            actions,
            source_id
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)",
        [
            $monster->name,
            sprintf("%s %s, %s", $monster->size, $monster->type, $monster->alignment),
            $monster->armor_class,
            sprintf("%s (%s)", $monster->hit_dice, $monster->hit_points),
            implode(", ", $speed),
            $monster->challenge_rating,
            $monster->strength,
            $monster->dexterity,
            $monster->constitution,
            $monster->intelligence,
            $monster->wisdom,
            $monster->charisma,
            implode("\n", $features),
            implode("\n", $actions)
        ]
    );
    
    
 
}