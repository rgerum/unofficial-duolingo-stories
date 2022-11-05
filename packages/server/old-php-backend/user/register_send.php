<?php
session_start();

include ( '../functions_new.php' );
require_once 'lib_swift/swift_required.php';
include("hash_functions.php");

function checkUsername($username) {
    global $db;
    $username = mysqli_escape_string($db, $_REQUEST["username"]);
    $result = mysqli_query($db,"SELECT id FROM user WHERE LOWER(username) = LOWER('$username')");

    if(mysqli_num_rows($result)) {
        http_response_code(403);
        print("Error username already exists");
        die();
    }
    return true;
}

$db = database();

$username = sqlSafeString($_POST['username']);
$email = sqlSafeString($_POST['email']);
$password = sqlSafeString(phpbb_hash($_POST['password']));
$activation_link = generateRandomString(10);

checkUsername($username);

$result = mysqli_query($db,"INSERT INTO user (username, email, password, activation_link) VALUES($username, $email, $password, \"$activation_link\")");
if($result) {

    $message = Swift_Message::newInstance();

    // Give the message a subject
    $message->setSubject("[Unofficial Duolingo Stories] Registration $username");
    
    // Set the From address with an associative array
    //->setFrom(array($email => "$user_firstname $user_surname"))
    $message->setFrom(array("stories@carex.uberspace.de" => "Unofficial Duolingo Stories"));
    
    // Set the To addresses with an associative array
    $message->setTo($_POST['email']);
    
    // Give it a body
    $message->setBody("Hey $username,<br/>
        You have registered on 'Unofficial Duolingo Stories'.<br/>
        To complete your registration click on the following link.<br/>
        <a href='https://carex.uber.space/stories/activate.html?username=$_POST[username]&activation_link=$activation_link'>Activate account</a>
        <br/><br/>
        Happy learning.
        ", 'text/html')
    ;

    $transport = Swift_MailTransport::newInstance();

    $mailer = Swift_Mailer::newInstance($transport);

    $resultmail = $mailer->send($message);

    return "All good";
}
else {
    print("Email could not be sent.");
    http_response_code(403);
}
