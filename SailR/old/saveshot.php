<?php
// Testons si le fichier a bien été envoyé et s'il n'y a pas d'erreur


$URI = $_POST['uri'];
$ID = substr($URI, strpos($URI, "=")+1); 
echo $ID;
if (isset($_FILES['file_contents']) AND $_FILES['file_contents']['error'] == 0)
{
        // Testons si le fichier n'est pas trop gros
        if ($_FILES['file_contents']['size'] <= 1000000)
        {
       
                        // On peut valider le fichier et le stocker définitivement
                        move_uploaded_file($_FILES['file_contents']['tmp_name'], 'uploads/screencaps/' . $ID.'.jpg');
                        echo "L'envoi a bien été effectué !";
                
        }
}
?>