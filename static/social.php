<!DOCTYPE html>
<html>
  <head>
    <meta name="twitter:card" content="summary">
    <meta name="twitter:site" content="#POST_BASE_URL#">

    <meta name="twitter:image" content="#POST_BASE_URL#/logo_white.png">
    <meta name="og:image" content="#POST_BASE_URL#/logo_white.png">
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
        $alchemy_url = "#POST_ALCHEMY_URL#";

        $methodSignature = 'uri(uint256)';

        $encodedSignature = Keccak::hash($methodSignature, 256);

        // First 4 bytes are the function selector
        $functionSelector = substr($encodedSignature, 0, 8);
        $id =  $_GET["id"];

        echo '<meta name="og:url" content="#POST_BASE_URL#/nft?id=' . $id . '" />';

        $hexId = dechex((float)$id);

        $padded = str_pad($hexId, 64, '0', STR_PAD_LEFT);

        $parameters = array(
          'to' => '#POST_ZANG_ADDRESS#',
          'data' => ('0x' . $functionSelector . $padded));

        $data = array(
          'jsonrpc' => '2.0',
          'method' => 'eth_call',
          'params' => array($parameters, 'latest')
        );

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

        // Remove the 0x prefix
        $resultData = substr($resultData, 2);

        // Remove the first 4 blocks from the result
        $resultData = substr($resultData, 32 * 4);

        function hex2str($hex) {
          $str = '';
          for($i=0;$i<strlen($hex);$i+=2) $str .= chr(hexdec(substr($hex,$i,2)));
          return $str;
        }

        $resultURI = hex2str($resultData);

        // Remove right whitespace
        $resultURI = rtrim($resultURI);

        $json_content = file_get_contents($resultURI, 'r');
        $json_content = json_decode($json_content);

        echo '<meta name="og:title" content="' . $json_content->name . '">';
        echo '<meta name="og:description" content="' . $json_content->description . '">';
      }

      $page = file_get_contents('#POST_BASE_URL#/nft/content');
      echo $page;
    ?>
  </head>

</html>		