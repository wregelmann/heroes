<?php

require_once __DIR__."/../includes/classes/collection.php";
require_once __DIR__."/../includes/classes/heroes_connector.php";

final class Heroes extends Collection {
    
    protected $filters = [
        "id" => "/^[0-9a-z\-]+$/"
    ];
    
    protected function read() {
               
        $heroes = new Heroes_Connector();
        
        if (isset($this->params["id"])) {
            $result = $heroes->query(
                    "SELECT h.*, r.name AS race FROM hero AS h
                    INNER JOIN race AS r ON h.race_id = r.id
                    WHERE h.id = ?", [$this->params["id"]]
                );
            if (count($result) >= 1) {
                $return = $result[0];
                $return->campaigns = $heroes->query(
                        "SELECT c.name, c.uuid FROM hero__campaign AS hc
                        INNER JOIN campaign AS c ON hc.campaign_id = c.id
                        WHERE hc.hero_id = ?", 
                        [$this->params["id"]]
                    );
                $return->classes = $heroes->query(
                        "SELECT hc.*, c.name AS class FROM hero__class AS hc
                        INNER JOIN class AS c ON hc.class_id = c.id
                        WHERE hc.hero_id = ?
                        ORDER BY hc.level, c.name",
                        [$this->params["id"]]
                    );
                foreach ($return->classes as $i=>$class) {
                    $return->classes[$i]->spells = $heroes->query(
                        "SELECT s.id, s.name FROM spell AS s
                        INNER JOIN hero__class__spell AS hcs ON s.id = hcs.spell_id
                        WHERE hcs.hero__class_id = ?
                        ORDER BY s.name",
                        [$class->id]
                    );
                }
                $return->saving_throws = array_column((array)$heroes->query(
                        "SELECT UPPER(a.abbreviation) AS abbr FROM ability AS a
                        INNER JOIN hero__saving_throw AS hs ON a.id = hs.ability_id
                        WHERE hs.hero_id = ?
                        ORDER BY a.id",
                        [$this->params["id"]]
                    ), "abbr");
                $return->skills = $heroes->query(
                        "SELECT s.name, UPPER(a.abbreviation) AS ability FROM skill AS s
                        INNER JOIN hero__skill AS hs ON s.id = hs.skill_id
                        INNER JOIN ability AS a ON s.ability_id = a.id
                        WHERE hs.hero_id = ?
                        ORDER BY s.name",
                        [$this->params["id"]]
                    );
                return $return;
            } else {
                http_response_code(404);
                return null;
            }
        }
        
        else {
            return (new Heroes_Connector)->query("SELECT id, name FROM hero"); 
        }
        
    }
    
}

new Heroes();