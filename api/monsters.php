<?php

require_once __DIR__."/../includes/classes/collection.php";
require_once __DIR__."/../includes/classes/heroes_connector.php";

final class Monsters extends Collection {
    
    protected $filters = [
        "id" => "/^[0-9a-z\-]+$/",
        "name" => "/.*/",
        "type" => "/.*/",
        "hp" => "/.*/",
        "speed" => "/.*/",
        "ac" => "/.*/",
        "cr" => "/.*/",
        "str" => "/[0-9]+/",
        "dex" => "/[0-9]+/",
        "con" => "/[0-9]+/",
        "int" => "/[0-9]+/",
        "wis" => "/[0-9]+/",
        "cha" => "/[0-9]+/",
        "features" => "/^[\s\S]+$/",
        "actions" => "/^[\s\S]+$/"
    ];
    
    protected function read() {
               
        $heroes = new Heroes_Connector();
        
        if (isset($this->params["id"])) {
            $result = $heroes->query(
                    "SELECT * FROM monster WHERE id = ?",
                    [$this->params["id"]]);
            if (count($result) >= 1) {
                return $result[0];
            } else {
                http_response_code(404);
                return null;
            }
        }
        
        else {
            return (new Heroes_Connector)->query(
                    "SELECT id, name, `type`, cr FROM monster ORDER BY name"
                ); 
        }
        
    }
    
    protected function create() {    
        
        (new Heroes_Connector)->query(
            "INSERT INTO monster
                (name, type, hp, speed, cr, ac, str, dex, con, `int`, wis, cha, features, actions)
            VALUES
                (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [
                $this->params["name"],
                $this->params["type"],
                $this->params["hp"],
                $this->params["speed"],
                $this->params["cr"],
                $this->params["ac"],
                $this->params["str"],
                $this->params["dex"],
                $this->params["con"],
                $this->params["int"],
                $this->params["wis"],
                $this->params["cha"],
                $this->params["features"],
                $this->params["actions"],
            ]
        );
        
        return null;
        
    }
    
}

new Monsters();