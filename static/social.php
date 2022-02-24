<!DOCTYPE html>
<html>
<head>

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@nytimes">
<meta name="twitter:creator" content="@SarahMaslinNir">
<meta name="twitter:description" content="NEWARK - The guest list and parade of limousines with celebrities emerging from them seemed more suited to a red carpet event in Hollywood or New York than than a gritty stretch of Sussex Avenue near the former site of the James M. Baxter Terrace public housing project here.">
<meta name="twitter:image" content="http://graphics8.nytimes.com/images/2012/02/19/us/19whitney-span/19whitney-span-articleLarge.jpg">
<?php
use kornrunner\Keccak;

$alchemy_url = "";

$agent = $_SERVER["HTTP_USER_AGENT"];

$methodSignature = 'uri(uint256)';
$encodedSignature = Keccak::hash($methodSignature, 256);
$id =  $_GET["id"];
$hexId = dechex((float)$id);

echo $hexId;

$padded = str_pad($hexId, 64, '0', STR_PAD_LEFT);

echo $padded;

/*
$data = array(
    'to' => '0xf2a7f0eb7fda1242e5188c8696e23ba7b70c9a4f',
    'key2' => 'value2');

echo '<meta name="twitter:title" content="NFT #' . $id . '">';

$options = array(
  'http' => array(
    'method'  => 'POST',
    'content' => json_encode( $data ),
    'header'=>  "Content-Type: application/json\r\n" .
                "Accept: application/json\r\n"
    )
);

$context  = stream_context_create( $options );
$result = file_get_contents( $url, false, $context );
$response = json_decode( $result );
*/
?>

</head>
<body>

<?php
$agent = $_SERVER["HTTP_USER_AGENT"];

if( preg_match('/MSIE (\d+\.\d+);/', $agent) ) {
  echo "You're using Internet Explorer";
} else if (preg_match('/Chrome[\/\s](\d+\.\d+)/', $agent) ) {
  echo "You're using Chrome";
} else if (preg_match('/Edge\/\d+/', $agent) ) {
  echo "You're using Edge";
} else if ( preg_match('/Firefox[\/\s](\d+\.\d+)/', $agent) ) {
  echo "You're using Firefox";
} else if ( preg_match('/OPR[\/\s](\d+\.\d+)/', $agent) ) {
  echo "You're using Opera";
} else if (preg_match('/Safari[\/\s](\d+\.\d+)/', $agent) ) {
  echo "You're using Safari";
}
?> 

</body>
</html>		