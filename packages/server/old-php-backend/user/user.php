<?php
session_start();
/*
Endpoint:

action: ["register", "send", "check", "set", "logout"]
username: the username
password: the new password (for "set" action)
uuid: the uuid (for "check" and "set")
*/
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

include ( '../functions_new.php' );
require_once 'lib_swift/swift_required.php';
include("hash_functions.php");


function uuidv4($data = null) {
    // Generate 16 bytes (128 bits) of random data or use the data passed into the function.
    $data = $data ?? random_bytes(16);
    assert(strlen($data) == 16);

    // Set version to 0100
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    // Set bits 6-7 to 10
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);

    // Output the 36 character UUID.
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}


function checkUsername($username, $existing) {
    global $db;
    $result = mysqli_query($db,"SELECT id, email FROM user WHERE LOWER(username) = LOWER('$username')");

    if($existing) {
        if(mysqli_num_rows($result)) {
            return mysqli_fetch_row($result);
        }
        http_response_code(403);
        print("Error username does not exists");
        die();
    }
    else {
        if(mysqli_num_rows($result)) {
            http_response_code(403);
            print("Error username already exists");
            die();
        }
        return true;
    }
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

function send_email($subject, $from, $to, $body) {
    $message = Swift_Message::newInstance();
    echo "<br/>SUBJECT $subject";
    // Give the message a subject
    $message->setSubject($subject);
echo "<br/>FROM $from";
    // Set the From address with an associative array
    $message->setFrom($from);
echo "<br/>TO $to";
    // Set the To addresses with an associative array
    $message->setTo($to);
echo "<br/>body $body";
    // Give it a body
    $message->setBody($body, 'text/html');
echo "<br/>1";
    $transport = Swift_MailTransport::newInstance();echo "<br/>2";
    $mailer = Swift_Mailer::newInstance($transport);echo "<br/>3";
    $resultmail = $mailer->send($message);echo "<br/>4";
}

function get_values($names) {
    global $db;
    $output = [];
    foreach ($names as $name) {
        if(!$_REQUEST[$name])
            echo "ERROR: $name not provided.\n";
        if($name == "password")
            $output[] = mysqli_escape_string($db, phpbb_hash($_REQUEST["password"]));
        $output[] = mysqli_escape_string($db, $_REQUEST[$name]);
    }
    return $output;
}

function check_login($db, $username, $password) {
    $username = mysqli_escape_string($db, $username);
    $user = mysqli_fetch_assoc(mysqli_query($db, "SELECT * FROM user WHERE username = '$username' AND activated = 1"));
    $hash = $user["password"];
    if(phpbb_check_hash($password, $hash)) {
        $_SESSION["user"] = $user;
    }
}

$db = database();

if( !isset($_SESSION["user"]) && isset($_COOKIE['username'])) {
    check_login($db, $_COOKIE['username'], $_COOKIE["password"]);
}
if( !isset($_SESSION["user"]) && isset($_REQUEST['username'])) {
    check_login($db, $_REQUEST['username'], $_REQUEST["password"]);
}

$action = $_REQUEST['action'];

if($action == "register") {
    echo "register\n";
    list($username, $password_hashed, $password, $email) = get_values(['username', 'password', 'email']);
    checkUsername($username, false);
    $activation_link = uuidv4();
    echo "username\n";
    $result = mysqli_query($db,"INSERT INTO user (username, email, password, activation_link) VALUES(\"$username\", \"$email\", \"$password_hashed\", \"$activation_link\")");

    echo "\n";
    echo "INSERT INTO user (username, email, password, activation_link) VALUES($username, $email, $password_hashed, \"$activation_link\")";
    echo "\n";
        echo "inserted\n";
    if($result) {
            echo "mail\n";
        send_email("[Unofficial Duolingo Stories] Registration $username",
            array("register@duostories.org" => "Unofficial Duolingo Stories"),
            $email,
            "Hey $username,<br/>
            <br/>
            You have registered on 'Unofficial Duolingo Stories'.<br/>
            To complete your registration click on the following link.<br/>
            <a href='https://www.duostories.org/task/activate/$username/$activation_link'>Activate account</a>
            <br/><br/>
            Happy learning.
            ");
        return "All good";
    }
    else {
        print("Email could not be sent.");
        http_response_code(403);
    }
}
else if($action == "activate") {
    list($username, $activation_link) = get_values(['username', 'activation_link']);
    list($id, $email) = checkUsername($username, true);

    $result = mysqli_query($db, "UPDATE user SET activated = 1 WHERE username = '$username' AND activation_link = '$activation_link';");

    if(0)
        http_response_code(403);
    else
        echo $_REQUEST["username"];
}
else if($action == "get_login") {
    if(isset($_SESSION["user"]))
        echo "{\"username\": \"".$_SESSION["user"]["username"]."\", \"role\": ".$_SESSION["user"]["role"].", \"admin\": ".$_SESSION["user"]["admin"]."}";
    else
        echo "null";
}
else if($action == "login") {
    list($username, , $password) = get_values(['username', 'password']);
    $username = mysqli_escape_string($db, $_REQUEST["username"]);
    $user = mysqli_fetch_assoc(mysqli_query($db, "SELECT * FROM user WHERE username = '$username' AND activated = 1"));
    $hash = $user["password"];
    echo "check".phpbb_check_hash($_REQUEST["password"], $hash);
    echo "<br/>";
    if(phpbb_check_hash($_REQUEST["password"], $hash)) {
        echo "yes";
        echo "<br/>";
    	$_SESSION["user"] = $user;
        print_r($_SESSION);
        http_response_code(200);
    }
    else
        http_response_code(403);
}
else if($action == "logout") {
    $_SESSION["user"] = null;
}
else if($action == "send") {
    list($username) = get_values(['username']);
    list($id, $email) = checkUsername($username, true);
    $activation_link = uuidv4();

    $result = mysqli_query($db,"INSERT INTO user_pw_reset (user_id, uuid) VALUES($id, \"$activation_link\")");

    if($result) {
        send_email(
        "[Unofficial Duolingo Stories] Reset Password $username",
        array("register@duostories.org" => "Unofficial Duolingo Stories"),
        $email,
        "Hey $username,<br/>
        You or someone else has requested a new password for 'Unofficial Duolingo Stories'.<br/>
        Use the following link to change your password (the link is valid for one day).<br/>
        <a href='https://www.duostories.org/task/resetpw/$_POST[username]/$activation_link'>Reset password</a>
        <br/><br/>
        Happy learning.
        ");

        return "All good";
    }
    else {
        print("Email could not be sent.");
        http_response_code(403);
    }
}
else if($action == "check") {
    list($username, $uuid) = get_values(['username', 'uuid']);
    list($id, $email) = checkUsername($username, true);
    if(checkUUID($id, $uuid)) {
        echo 1;
    }
    else {
        http_response_code(403);
        echo 0;
    }
}
else if($action == "set") {
    list($username, $password_hashed, $password, $uuid) = get_values(['username', 'password', 'uuid']);
    list($id, $email) = checkUsername($username, true);
    if(checkUUID($id, $uuid)) {
        $result = mysqli_query($db,"UPDATE user SET password = '$password_hashed' WHERE id = $id");
        echo "Password changed to $password_hashed $password";
        // link is only valid once
        $result = mysqli_query($db,"DELETE FROM user_pw_reset WHERE user_pw_reset WHERE user_id = $id AND uuid = '$uuid'");
    }
    else {
        http_response_code(403);
        echo '0';
    }
}
else {
    echo "unknown action";
}
