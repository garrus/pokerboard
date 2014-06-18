<?php
list(, $data) = explode('base64,', file_get_contents('php://input'), 2);
$filename = __DIR__. '/exports/poker-board-'. $_GET['id']. '.png';
file_put_contents($filename, base64_decode($data));