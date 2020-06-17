<?php

require_once __DIR__."/../vendor/autoload.php";

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;

class HeroesWS implements MessageComponentInterface {
    
    protected $clients;
    
    public function __construct() {
        $this->clients = new \SplObjectStorage;
    }
    
    public function onOpen(ConnectionInterface $conn) {
        $this->clients->attach($conn);
        echo sprintf("New connection! (%s)\n", $conn->resourceId);
    }
    
    public function onMessage(ConnectionInterface $from, $msg) {
        echo sprintf("Connection %s sent: \"%s\"\n", $from->resourceId, $msg);
        foreach ($this->clients as $client) {
            $client->send($msg);
        }
    }
    
    public function onClose(ConnectionInterface $conn) {
        $this->clients->detach($conn);
        $conn->close();
    }
    
    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo sprintf("Error: %s\n", $e->getMessage());
        $conn->close();
    }
    
}