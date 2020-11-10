
<?php
$d=date ("d");
$m=date ("m");
$y=date ("Y");
$t=time();
$dmt=$d+$m+$y+$t;    
$ran= rand(0,10000000);
$dmtran= $dmt+$ran;
$un=  uniqid();
$dmtun = $dmt.$un;
$mdun = md5($dmtran.$un);
$sort=substr($mdun, 16); // if you want sort length code.


?>

<?php
$target_dir = "uploads/";

$uploadOk = 1;
$FileType = pathinfo($_FILES["fileToUpload"]["name"],PATHINFO_EXTENSION);

// Allow certain file formats
if(strcasecmp($FileType,"kml")!=0 && strcasecmp($FileType,"gpx")!=0  ) {
    echo "Sorry, only KML/GPX files are allowed.";
    $uploadOk = 0;
}
if(strcasecmp($FileType,"kml")==0)
{
$target_file = $target_dir . $mdun.".kml";
$url= "http://volodiaja.net/SailR/?kml=".$mdun;
}
if(strcasecmp($FileType,"gpx")==0)
{
$target_file = $target_dir . $mdun.".gpx";
$url= "http://volodiaja.net/SailR/?gpx=".$mdun;
}
// Check if file already exists
if (file_exists($target_file)) {
    echo "Sorry, file already exists.";
    $uploadOk = 0;
}
// Check file size
if ($_FILES["fileToUpload"]["size"] > 1000000) {
    echo "Sorry, your file is too large.";
    $uploadOk = 0;
}

// Check if $uploadOk is set to 0 by an error
if ($uploadOk == 0) {
    echo "Sorry, your file was not uploaded.";
// if everything is ok, try to upload file
} else {
    if (move_uploaded_file($_FILES["fileToUpload"]["tmp_name"], $target_file)) {
		header("Location: ".$url);
        //echo "The file ". basename( $_FILES["fileToUpload"]["name"]). " has been uploaded.";
    } else {
        echo "Sorry, there was an error uploading your file.";
    }
}

?>