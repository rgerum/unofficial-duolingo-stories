<?php
session_start();
/*
Endpoint:

action: ["send", "check", "set"]
username: the username
password: the new password (for "set" action)
uuid: the uuid (for "check" and "set")
*/

include ( '../functions_new.php' );
require_once 'lib_swift/swift_required.php';
include("hash_functions.php");

function checkUsername($username) {
    global $db;
    $result = mysqli_query($db,"SELECT id, email FROM user WHERE LOWER(username) = LOWER('$username')");

    if(mysqli_num_rows($result)) {
        return mysqli_fetch_row($result);
    }
    http_response_code(403);
    print("Error username does not exists");
    die();
}
function checkUUID($id, $uuid) {
    global $db;
    // delete old
    $result = mysqli_query($db,"DELETE FROM user_pw_reset WHERE TIMESTAMPDIFF(DAY, time, CURRENT_TIMESTAMP()) > 1");
    $result = mysqli_query($db,"SELECT id FROM user_pw_reset WHERE user_id = $id AND uuid = '$uuid'");

    if(mysqli_num_rows($result))
        return true;
    return false;
}

$db = database();

$action = $_REQUEST['action'];
$username = mysqli_escape_string($db, $_REQUEST["username"]);
$uuid = mysqli_escape_string($db, $_REQUEST["uuid"]);
$password = mysqli_escape_string($db, phpbb_hash($_REQUEST["password"]));


$row = checkUsername($username);
$id = $row[0];
$email = $row[1];

if($action == "send") {
    $activation_link = uuidv4();

    $result = mysqli_query($db,"INSERT INTO user_pw_reset (user_id, uuid) VALUES($id, \"$activation_link\")");

    if($result) {

        $message = Swift_Message::newInstance();

        // Give the message a subject
        $message->setSubject("[Unofficial Duolingo Stories] Reset Password $username");

        // Set the From address with an associative array
        //->setFrom(array($email => "$user_firstname $user_surname"))
        $message->setFrom(array("stories@carex.uberspace.de" => "Unofficial Duolingo Stories"));

        // Set the To addresses with an associative array
        $message->setTo($email);

        // Give it a body
        $message->setBody("Hey $username,<br/>
            You or someone else has requested a new password for 'Unofficial Duolingo Stories'.<br/>
            Use the following link to change your password (the link is valid for one day).<br/>
            <a href='https://carex.uber.space/stories/reset_pw.html?username=$_POST[username]&activation_link=$activation_link'>Reset password</a>
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
}
else if($action == "check") {

    if(checkUUID($id, $uuid)) {
        echo 1;
        die();
    }
    http_response_code(403);
    echo 0;
    die();
}
else if($action == "set") {
    if(checkUUID($id, $uuid)) {
        $result = mysqli_query($db,"UPDATE user SET password = '$password' WHERE id = $id");
        echo "Password changed to $password".$_REQUEST["password"];
        // link is only valid once
        $result = mysqli_query($db,"DELETE FROM user_pw_reset WHERE user_pw_reset WHERE user_id = $id AND uuid = '$uuid'");
    }
}
else {
    echo "unknown action";
}


