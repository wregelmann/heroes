<?php

require_once __DIR__."/../includes/classes/collection.php";
require_once __DIR__."/../includes/classes/heroes_connector.php";

final class Items extends Collection {
    
    protected $filters = [
        "id" => "/^[0-9a-z\-]+$/",
        "name" => "/.*/",
        "type" => "/^[0-9]+$/",
        "description" => "/^[\s\S]+$/"
    ];
    
    protected function read() {
               
        $heroes = new Heroes_Connector();
        
        if (isset($this->params["id"])) {
            $result = $heroes->query(
                    "SELECT i.*, it.name AS type FROM item AS i
                    INNER JOIN item_type AS it ON i.type_id = it.id
                    WHERE i.id = ?",
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
                    "SELECT i.*, it.name AS type FROM item AS i
                    INNER JOIN item_type AS it ON i.type_id = it.id
                    ORDER BY i.name"
                ); 
        }
        
    }
    
    protected function create() {    
        
        (new Heroes_Connector)->query(
            "INSERT INTO item (name, type_id, description) VALUES (?, ?, ?)",
            [
                $this->params["name"],
                $this->params["type"],
                $this->params["description"]
            ]
        );
        
        return null;
        
    }
    
}

new Items();