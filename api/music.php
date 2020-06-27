<?php

require_once __DIR__."/../includes/classes/collection.php";
require_once __DIR__."/../includes/classes/heroes_connector.php";

final class Music extends Collection {
    
    protected $filters = [
        "id" => "/^[0-9a-z\-]+$/"
    ];
    
    protected function read() {
               
        $heroes = new Heroes_Connector();
        
        if (isset($this->params["id"])) {
            $files = scandir(sprintf("%s/../media/music/%s/", __DIR__, $this->params["id"]));
            if (count($files) >= 1) {
                $return = [];
                foreach ($files as $file) {
                    if (preg_match("/^([^\.]+)\..+$/", $file, $matches)) {
                        array_push($return, (object)[
                            "name" => $matches[1],
                            "path" => sprintf("https://heroes.willandbritta.com/media/music/%s/%s", $this->params["id"], $file)
                        ]);
                    }
                }
                return $return;
            } else {
                http_response_code(404);
                return null;
            }
        }
        
        else {
        }
        
    }
    
}

new Music();