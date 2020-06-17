<?php

require_once __DIR__.'/api_connector.php';

final class Open5e_Connector extends API_Connector{

    public function __construct(){
        parent::__construct((object)[
            "host" => "https://api.open5e.com"
        ]);
        $this->curl_opts[CURLOPT_VERBOSE]=true;
    }
    
    public function __destruct(){
        parent::__destruct();
    }
        
    function get($resource, $options = []){
        return parent::get($resource, array_merge($options, ["format" => "json", "limit" => 10000]));
    }

}