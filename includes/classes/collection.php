<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

abstract class Collection {
    
    protected $filters = [], $params = [], $remote_user, $unsafe_params = [];
    
    public function __construct(){
        
        $this->validate();
        
        switch ($_SERVER['REQUEST_METHOD']) {
            
            case 'POST':
                http_response_code(201);
                echo json_encode($this->create(), JSON_PRETTY_PRINT | JSON_INVALID_UTF8_SUBSTITUTE);
                break;
            
            case 'GET':
                echo json_encode($this->read(), JSON_PRETTY_PRINT | JSON_INVALID_UTF8_SUBSTITUTE);
                break;
            
            case "PUT": case "PATCH":
                echo json_encode($this->update(), JSON_PRETTY_PRINT | JSON_INVALID_UTF8_SUBSTITUTE);
                break;
            
            case 'DELETE':
                echo json_encode($this->delete(), JSON_PRETTY_PRINT | JSON_INVALID_UTF8_SUBSTITUTE);
                break;
            
            
            default:
                http_response_code(405);
            
        }
        
    }
    
    private function validate(){
        parse_str(file_get_contents("php://input"),$post_vars);
        foreach (array_merge($_GET,$post_vars) as $key=>$value) {
            $this->unsafe_params[$key] = $value;
            if (isset($this->filters[$key])) {
                if (preg_match($this->filters[$key],$value)) {
                    $this->params[$key] = $value;
                } else {
                    http_response_code(400);
                    die("{'error': 'invalid value for parameter $key'}");
                }
            }
        }
    }
    
    protected function create(){
        http_response_code(501);
        return null;
    }
    
    protected function read(){
        http_response_code(501);
        return null;
    }
    
    protected function update(){
        http_response_code(501);
        return null;
    }
    
    protected function delete(){
        http_response_code(501);
        return null;
    }
    
}