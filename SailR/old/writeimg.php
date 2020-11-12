<?php

$ImageCaptured = $_GET['ImageCaptured'];
$ImageName = $_GET['ImageName'];
echo $ImageCaptured;
if($ImageCaptured!=""){

$filteredData=substr($ImageCaptured, strpos($ImageCaptured, ",")+1);

// Need to decode before saving since the data we received is already base64 encoded
$unencodedData=base64_decode($filteredData);
echo "bah";

$ImageURL="uploads/screencaps/".$ImageName.".png";

// Save file. This example uses a hard coded filename for testing,
// but a real application can specify filename in POST variable
file_put_contents($ImageURL, $unencodedData);


}
?>