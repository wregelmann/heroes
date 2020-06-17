<?php

class PDO_Connector {
    
    protected $pdo;
    
    public function __construct($resource){
        $this->type = $resource->type;
        switch ($this->type) {
            case 'sqlsrv':
                $connection_str = sprintf(
                        ":Server=%s%s;Database=%s",
                        $resource->host,
                        isset($resource->port) ? sprintf(",%s", $resource->port) : '',
                        $resource->dbname
                    );
                break;
            case 'odbc':
                putenv("ODBCINI=/etc/odbc.ini");
                putenv("ODBCINST=/etc/odbcinst.ini");
                $connection_str = sprintf(":%s", $resource->dsn);
                break;
            default:
                $connection_str = sprintf(
                        ":host=%s%s;dbname=%s",
                        $resource->host,
                        isset($resource->port) ? sprintf(";port=%s", $resource->port) : '',
                        $resource->dbname
                    );
                break;
        }
        $this->pdo = new PDO(sprintf("%s%s", $resource->type, $connection_str), $resource->user, $resource->pass);
    }
    
    public function __destruct(){
        $this->pdo = null;
    }
    
    public function query($query, $params = []){
        $sth = $this->pdo->prepare($query);
        $sth->execute($params);
        return $sth->fetchAll(PDO::FETCH_OBJ);
    }
    
    public function last_insert_id(){
        return $this->pdo->lastInsertId();
    }
    
    public function error_info(){
        return $this->pdo->errorInfo();
    }
        
}