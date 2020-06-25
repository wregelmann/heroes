<?php

require_once __DIR__."/../includes/classes/collection.php";
require_once __DIR__."/../includes/classes/heroes_connector.php";

final class Features extends Collection {
    
    protected $filters = [
        "id" => "/^[0-9a-z\-]+$/",
        "name" => "/.*/",
        "description" => "/^[\s\S]+$/"
    ];
    
    protected function read() {
               
        $heroes = new Heroes_Connector();
        
        if (isset($this->params["id"])) {
            $result = $heroes->query(
                    "SELECT * FROM feature WHERE id = ?",
                    [$this->params["id"]]);
            if (count($result) >= 1) {
                return $result[0];
            } else {
                http_response_code(404);
                return null;
            }
        }
        
        else {
            return (new Heroes_Connector)->query("SELECT id, name FROM feature ORDER BY name"); 
        }
        
    }
    
    protected function create() {    
        
        (new Heroes_Connector)->query(
            "INSERT INTO feature (name, description) VALUES (?, ?)",
            [
                $this->params["name"],
                $this->params["description"]
            ]
        );
        
        return null;
        
    }
    
}

new Features();