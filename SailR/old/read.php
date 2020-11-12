<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
<title>SailR - Reader</title>
<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">
<style type="text/css">
</style>
</head>
<body>
<?php
$password = "my_password";

  print "<h2 align=\"center\">SailR Reader</h2>";
// If password is valid let the user get access
if (isset($_POST["password"]) && ($_POST["password"]=="$password")) {
$dir = "uploads/";
chdir($dir);
echo "<table>";
array_multisort(array_map('filemtime', ($files = glob("*.{kml}", GLOB_BRACE))), SORT_DESC, $files);
foreach($files as $filename)
{
$url = "http://volodiaja.net/SailR/?kml=".substr($filename, 0, -4);
echo "<tr>";
  echo "<td><a href='".$url."'>".substr($filename, 0, -4)." ".date ("F d Y H:i:s.", filemtime($filename))."</a></td><td><img src='https://api.pagelr.com/capture/javascript?uri=".$url."&width=600&height=420&delay=20000&key=65Jt7fALzUO-H9EWL8urxA'></img></td>"; 
  echo "</tr>";
  
}  
echo "</table>";
}
else
{
// Wrong password or no password entered display this message
if (isset($_POST['password']) || $password == "") {
  print "<p align=\"center\"><font color=\"red\"><b>Incorrect Password</b><br>Please enter the correct password</font></p>";}
  print "<form method=\"post\"><p align=\"center\">Please enter your password for access<br>";
  print "<input name=\"password\" type=\"password\" size=\"25\" maxlength=\"12\"><input value=\"Login\" type=\"submit\"></p></form>";
}
 
?>
</body>
</html>


