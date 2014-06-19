<?php
list(, $data) = explode('base64,', file_get_contents('php://input'), 2);
$filename = __DIR__. '/exports/'. $_GET['name']. '.png';
file_put_contents($filename, base64_decode($data));
