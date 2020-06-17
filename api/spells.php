<?php

require_once __DIR__."/../includes/classes/collection.php";
require_once __DIR__."/../includes/classes/heroes_connector.php";

final class Spells extends Collection {
    
    protected $filters = [
        "id" => "/^[0-9a-z\-]+$/"
    ];
    
    protected function read() {
               
        $heroes = new Heroes_Connector();
        
        if (isset($this->params["id"])) {
            $result = $heroes->query(
                    "SELECT s.*, ss.name AS spell_school FROM spell AS s
                    INNER JOIN spell_school AS ss ON s.spell_school_id = ss.id
                    WHERE s.id = ?",
                    [$this->params["id"]]);
            if (count($result) >= 1) {
                return $result[0];
            } else {
                http_response_code(404);
                return null;
            }
        }
        
        else {
            return (new Heroes_Connector)->query("SELECT id, name FROM spell"); 
        }
        
    }
    
}

new Spells();