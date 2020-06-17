<?php

/**
 * Extensible class for handling connections to REST APIs
 */
class API_Connector {

    protected $curl, $curl_opts, $url;

    /**
     * Initiates curl handle
     * 
     * @param string    $url
     * @param string    $user   API username or key for basic authentication
     * @param string    $pass   API password
     */
    public function __construct($resource){
        $this->url = $resource->host;
        $this->curl = curl_init();
        $this->curl_opts = array (
            CURLOPT_HTTPHEADER => array('Content-type: application/json'),
            CURLOPT_RETURNTRANSFER => true
        );
        if(isset($resource->user) && isset($resource->pass)) {
            $this->curl_opts[CURLOPT_USERPWD] = sprintf('%s:%s', $resource->user, $resource->pass);
        } else if (isset($resource->token)) {
            array_push($this->curl_opts[CURLOPT_HTTPHEADER], sprintf('Authorization: Bearer %s',$resource->token));
        }
    }
    
    public function __destruct(){
        $this->curl ? curl_close($this->curl) : null;
    }
    
    protected function exec(){
        return json_decode(curl_exec($this->curl), false);
    }
    
    protected function reset_opts(){
        curl_reset($this->curl);
        curl_setopt_array($this->curl, $this->curl_opts);
    }

    /**
    * Makes an API call
    * 
    * @param   string  $path
    * @param   array   $parameters (optional)
    * @return  object  An object parsed  from JSON returned by the API
    */
    public function get(){
        $this->reset_opts();
        $arg_list = func_get_args();
        $url = $this->url . $arg_list[0];
        if (isset($arg_list[1])) {
            $url .= (strpos($url, '?') !== false ? '&' : '?');
            foreach ($arg_list[1] as $key=>$param) {
                $url .= $key . '=' . $param . '&';
            }
            $url = trim($url, '&');
        }
        curl_setopt($this->curl, CURLOPT_URL, $url);
        return $this->exec();
    }

    public function post($location, $params = []){
        $this->reset_opts();
        curl_setopt($this->curl, CURLOPT_POST, 1);
        curl_setopt($this->curl, CURLOPT_URL, $this->url.$location);
        if (count($params)) {
            curl_setopt($this->curl, CURLOPT_POSTFIELDS, json_encode($params));
        }
        return $this->exec();
    }
    
    public function put(){
        $this->reset_opts();
        curl_setopt($this->curl, CURLOPT_POST, 1);
        $arg_list = func_get_args();
        curl_setopt($this->curl, CURLOPT_URL, $this->url.$arg_list[0]);
        curl_setopt($this->curl, CURLOPT_CUSTOMREQUEST, 'PUT');
        if (isset($arg_list[1])) {
            curl_setopt($this->curl, CURLOPT_POSTFIELDS, json_encode($arg_list[1]));
        }
        return $this->exec();
    }
     
    public function put_xml(){
        $this->reset_opts();
        curl_setopt($this->curl, CURLOPT_POST, 1);
        $arg_list = func_get_args();
        curl_setopt($this->curl, CURLOPT_URL, $this->url.$arg_list[0]);
        curl_setopt($this->curl, CURLOPT_CUSTOMREQUEST, 'PUT');
        if (isset($arg_list[1])) {
            $xml = new SimpleXMLElement('<'.$arg_list[2].'/>');
            array_walk_recursive(array_flip($arg_list[1]), array($xml, 'addChild'));
            curl_setopt($this->curl, CURLOPT_POSTFIELDS, $xml->asXML());
        }
        return $this->exec();
    }
    
    public function delete(){
        $this->reset_opts();
        $arg_list = func_get_args();
        curl_setopt($this->curl, CURLOPT_URL, $this->url.$arg_list[0]);
        curl_setopt($this->curl, CURLOPT_CUSTOMREQUEST, 'DELETE');
        if (isset($arg_list[1])) {
            curl_setopt($this->curl, CURLOPT_POSTFIELDS, json_encode($arg_list[1]));
        }
        return $this->exec();
    }
    
}

