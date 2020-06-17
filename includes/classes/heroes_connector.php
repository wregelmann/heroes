<?php

require_once __DIR__.'/pdo_connector.php';

final class Heroes_Connector extends PDO_Connector {
       
    public function __construct(){
        parent::__construct((object)[
            "type" => "mysql",
            "host" => "localhost",
            "dbname" => "heroes",
            "user" => "hero",
            "pass" => "Billy123!@#$"
        ]);
    }

    public function __destruct(){
        parent::__destruct();
    }
        
}