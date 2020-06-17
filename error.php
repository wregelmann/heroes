<?php

switch ($_GET["code"]) {
    case 100: $text = 'Continue'; break;
    case 101: $text = 'Switching Protocols'; break;
    case 200: $text = 'OK'; break;
    case 201: $text = 'Created'; break;
    case 202: $text = 'Accepted'; break;
    case 203: $text = 'Non-Authoritative Information'; break;
    case 204: $text = 'No Content'; break;
    case 205: $text = 'Reset Content'; break;
    case 206: $text = 'Partial Content'; break;
    case 300: $text = 'Multiple Choices'; break;
    case 301: $text = 'Moved Permanently'; break;
    case 302: $text = 'Moved Temporarily'; break;
    case 303: $text = 'See Other'; break;
    case 304: $text = 'Not Modified'; break;
    case 305: $text = 'Use Proxy'; break;
    case 400: $text = 'Bad Request'; break;
    case 401: $text = 'Unauthorized'; break;
    case 402: $text = 'Payment Required'; break;
    case 403: $text = 'Forbidden'; break;
    case 404: $text = 'Adventure Not Found'; break;
    case 405: $text = 'Method Not Allowed'; break;
    case 406: $text = 'Not Acceptable'; break;
    case 407: $text = 'Proxy Authentication Required'; break;
    case 408: $text = 'Request Time-out'; break;
    case 409: $text = 'Conflict'; break;
    case 410: $text = 'Gone'; break;
    case 411: $text = 'Length Required'; break;
    case 412: $text = 'Precondition Failed'; break;
    case 413: $text = 'Request Entity Too Large'; break;
    case 414: $text = 'Request-URI Too Large'; break;
    case 415: $text = 'Unsupported Media Type'; break;
    case 500: $text = 'Internal Server Error'; break;
    case 501: $text = 'Not Implemented'; break;
    case 502: $text = 'Bad Gateway'; break;
    case 503: $text = 'Service Unavailable'; break;
    case 504: $text = 'Gateway Time-out'; break;
    case 505: $text = 'HTTP Version not supported'; break;
    default:
        exit('Unknown http status code "' . htmlentities($code) . '"');
    break;
}

$mailto = sprintf(
        "mailto:%s?subject=%s&body=%s",
        "helpdesk@watchcomm.net",
        urlencode(sprintf("Cortex - %s", $_GET["code"])),
        urlencode(sprintf(
                "Status Code: %s\nLocation: %s\nTime: %s",
                http_response_code(),
                $_SERVER['REQUEST_URI'],
                $_SERVER['REQUEST_TIME']
            ))
    );

?>

<head>

    <title><?=$_GET["code"]?> - <?=$text?></title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <link rel="icon" href="favicon.png">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/uikit@3.5.4/dist/css/uikit.min.css" />

    <script src="https://cdn.jsdelivr.net/npm/uikit@3.5.4/dist/js/uikit.min.js"></script>
    <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
    
    <style>
        
        body {
            position: absolute;
            top: 0; bottom: 0; left: 0; right: 0;
            background: #333;
            overflow: hidden;
        }

        img {
            display: block;
            margin: auto;
        }
        
        #response {
            color: #eee;
            text-align: center;
            position: relative;
            top: 20%;
        }

        #error_code {
            display: block;
            font-size: 10em;
        }

        #error_message {
            display: block;
            font-size: 2em;
        }
        
    </style>

</head>

<body>
    
    <div id="response">
        <img src="includes/wahlberg.gif"></img>
        <span id="error_code" class="uk-margin uk-animation-shake"><?=$_GET["code"]?></span>
        <span id="error_message" class="uk-margin"><?=$text?></span>
    </div>

</body>