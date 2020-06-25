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
                $return->features = $heroes->query(
                        "SELECT f.id, f.name FROM feature AS f
                        INNER JOIN hero__feature AS hf ON hf.feature_id = f.id
                        WHERE hf.hero_id = ?
                        ORDER BY f.name",
                        [$this->params["id"]]
                    );
                $return->inventory = $heroes->query(
                        "SELECT hi.item_id AS id, i.name, hi.quantity
                        FROM hero__item AS hi
                        INNER JOIN item AS i ON hi.item_id = i.id
                        WHERE hi.hero_id = ?
                        ORDER BY i.name",
                        [$this->params["id"]]
                    );
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
    
    public function update(){
       
        $heroes = new Heroes_Connector();
        
        foreach ($this->unsafe_params["add"]["items"] as $item) {
            $result = $heroes->query(
                    "SELECT id FROM hero__item WHERE hero_id = ? AND item_id = ?",
                    [
                        $this->params["id"],
                        $item["id"]
                    ]
                );
            if (count($result) == 0) {
                $heroes->query(
                    "INSERT INTO hero__item (hero_id, item_id, quantity) VALUES (?, ?, ?)",
                    [
                        $this->params["id"],
                        $item["id"],
                        $item["quantity"]
                    ]
                );
            } else {
                $heroes->query(
                    "UPDATE hero__item SET quantity = quantity + ? WHERE id = ?",
                    [
                        $item["quantity"],
                        $result[0]->id
                    ]
                );
            }
        }
        foreach ($this->unsafe_params["add"]["features"] as $feature) {
            $result = $heroes->query(
                    "SELECT id FROM hero__feature WHERE hero_id = ? AND feature_id = ?",
                    [
                        $this->params["id"],
                        $feature["id"]
                    ]
                );
            if (count($result) == 0) {
                $heroes->query(
                    "INSERT INTO hero__feature (hero_id, feature_id) VALUES (?, ?)",
                    [
                        $this->params["id"],
                        $feature["id"]
                    ]
                );
            }
        }
        foreach ($this->unsafe_params["add"]["spells"] as $spell) {
            $result = $heroes->query(
                    "SELECT id FROM hero__class__spell WHERE hero__class_id = ? AND spell_id = ?",
                    [
                        $spell["heroClassId"],
                        $spell["id"]
                    ]
                );
            if (count($result) == 0) {
                $heroes->query(
                    "INSERT INTO hero__class__spell (hero__class_id, spell_id) VALUES (?, ?)",
                    [
                        $spell["heroClassId"],
                        $spell["id"]
                    ]
                );
            }
        }
        
        foreach ($this->unsafe_params["remove"]["items"] as $item) {
            $result = $heroes->query(
                    "SELECT quantity FROM hero__item WHERE hero_id = ? AND item_id = ?",
                    [
                        $this->params["id"],
                        $item["id"]
                    ]
                );
            if ($result[0]->quantity < $item["quantity"] || !$item["quantity"]) {
                $heroes->query(
                    "DELETE FROM hero__item WHERE hero_id = ? AND item_id = ?",
                    [
                        $this->params["id"],
                        $item["id"]
                    ]
                );
            } else {
                $heroes->query(
                    "UPDATE hero__item SET quantity = quantity - ? WHERE hero_id = ? AND item_id = ?",
                    [
                        $item["quantity"],
                        $this->params["id"],
                        $item["id"]
                    ]
                );
            }
        }
        foreach ($this->unsafe_params["remove"]["features"] as $feature) {
            $heroes->query(
                "DELETE FROM hero__feature WHERE hero_id = ? AND feature_id = ?",
                [
                    $this->params["id"],
                    $feature["id"]
                ]
            );
        }
        foreach ($this->unsafe_params["remove"]["spells"] as $spell) {
            $heroes->query(
                "DELETE FROM hero__class__spell WHERE hero__class_id = ? AND spell_id = ?",
                [
                    $spell["heroClassId"],
                    $spell["id"]
                ]
            );
        }
        
        if (isset($this->unsafe_params["update"]["hp"])) {
            $heroes->query(
                "UPDATE hero SET hp = ? WHERE id = ?",
                [
                    $this->unsafe_params["update"]["hp"],
                    $this->params["id"]
                ]
            );
        }
        
    }
    
}

new Heroes();