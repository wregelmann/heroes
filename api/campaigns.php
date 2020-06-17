<?php

require_once __DIR__."/../includes/classes/collection.php";
require_once __DIR__."/../includes/classes/heroes_connector.php";

final class Campaigns extends Collection {
    
    protected $filters = [
        "id" => "/^[0-9a-z\-]+$/"
    ];
    
    protected function read() {
               
        $heroes = new Heroes_Connector();
        
        if (isset($this->params["id"])) {
            $result = $heroes->query("SELECT id, name FROM campaign WHERE uuid = ?", [$this->params["id"]]);
            if (count($result) >= 1) {
                $result[0]->heroes = $heroes->query(
                        "SELECT h.* FROM hero AS h
                        INNER JOIN hero__campaign AS hc ON h.id = hc.hero_id
                        WHERE hc.campaign_id = ?
                        ORDER BY h.name",
                        [$result[0]->id]
                    );
                return $result[0];
            } else {
                http_response_code(404);
                return null;
            }
        }
        
        else {
            return (new Heroes_Connector)->query("SELECT id, name FROM campaign"); 
        }
        
    }
    
}

new Campaigns();