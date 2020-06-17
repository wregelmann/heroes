<?php

require_once __DIR__."/../includes/classes/collection.php";
require_once __DIR__."/../includes/classes/heroes_connector.php";

final class Advancement extends Collection {
        
    protected function read() {
               
        return (new Heroes_Connector)->query("SELECT * FROM advancement ORDER BY level");
        
    }
    
}

new Advancement();