<!DOCTYPE html>
<html>
<head>


<meta name="twitter:card" content="summary">
<meta name="twitter:site" content="alpha.zang.gallery">

<meta name="twitter:image" content="https://alpha.zang.gallery/logo_white.png">
<meta name="og:image" content="https://alpha.zang.gallery/logo_white.png">
<?php

function isCommonBrowser() {
    $agent = $_SERVER["HTTP_USER_AGENT"];
    $browsers = array(
        'Chrome', 'Firefox', 'Opera', 'OPR', 'Edge', 'Safari', 'MSIE', 'Trident/7'
    );
    for ($i = 0; $i < count($browsers); $i++) {
        if (strpos($agent, $browsers[$i])) {
            return true;
        }
    }

    return false;
}
use kornrunner\Keccak;

if (!isCommonBrowser()) {
    include "Keccak.php";
    ini_set('display_errors', '1');
    ini_set('display_startup_errors', '1');
    error_reporting(E_ALL);
    $alchemy_url = "";



    $methodSignature = 'uri(uint256)';

    //echo '<p>Method: ' . $methodSignature . '</p>';

    $encodedSignature = Keccak::hash($methodSignature, 256);
    $functionSelector = substr($encodedSignature, 0, 8); // First 4 bytes are the function selector
    $id =  $_GET["id"];

    echo '<meta name="og:url" content="https://alpha.zang.gallery/nft?id=' . $id . '" />';

    $hexId = dechex((float)$id);

    //echo '<p>HEX: ' . $hexId . '</p>';

    $padded = str_pad($hexId, 64, '0', STR_PAD_LEFT);

    //echo $padded;

    //echo '<p> Encoded signature: ' . $functionSelector . '</p>';


    $parameters = array(
        'to' => '0xf2a7f0eb7fda1242e5188c8696e23ba7b70c9a4f',
        'data' => ('0x' . $functionSelector . $padded));

    $data = array(
    'jsonrpc' => '2.0',
    'method' => 'eth_call',
    'params' => array($parameters, 'latest')
    );

    //echo 'Test';
    //echo '<p>Data: ' . json_encode($data) . '</p>';


    $options = array(
    'http' => array(
        'method'  => 'POST',
        'content' => json_encode( $data ),
        'header'=>  "Content-Type: application/json\r\n" .
                    "Accept: application/json\r\n"
        )
    );

    $context  = stream_context_create( $options );
    $result = file_get_contents($alchemy_url, false, $context);
    $response = json_decode( $result );
    $resultData = $response->result;
    //echo $result;
    //echo '<p>' . $resultData . '</p>';

    // Remove the 0x prefix
    $resultData = substr($resultData, 2);

    // Remove the first 4 blocks from the result
    // The first 
    $resultData = substr($resultData, 32 * 4);
    /*echo '<p>' . substr($resultData, 0, 32) . '</p>';
    echo '<p>' . substr($resultData, 32, 32) . '</p>';
    echo '<p>' . substr($resultData, 32 * 2, 32) . '</p>';
    echo '<p>' . substr($resultData, 32 * 3, 32) . '</p>';
    echo '<p>' . substr($resultData, 32 * 4, 32) . '</p>';
    echo '<p>' . substr($resultData, 32 * 5, 32) . '</p>';*/

    function hex2str($hex) {
    $str = '';
    for($i=0;$i<strlen($hex);$i+=2) $str .= chr(hexdec(substr($hex,$i,2)));
    return $str;
    }

    $resultURI = hex2str($resultData);
    //echo '<p>' . $resultURI . '</p>';
    // Remove right whitespace
    $resultURI = rtrim($resultURI);

    $json_content = file_get_contents($resultURI, 'r');
    $json_content = json_decode($json_content);
    //echo '<p>' . json_encode($json_content) . '</p>';
    //echo '<meta name="twitter:title" content="' . $json_content->name . '">';
    echo '<meta name="og:title" content="' . $json_content->name . '">';
    //echo '<meta name="twitter:description" content="' . $json_content->description . '">';
    echo '<meta name="og:description" content="' . $json_content->description . '">';
}
$page = file_get_contents('https://alpha.zang.gallery/nft/content');
echo $page;
?>
</head>

</html>		