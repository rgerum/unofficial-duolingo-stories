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
include("../user/hash_functions.php");


function get_values($db, $names) {
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

function query_json($db, $query) {
    $result = mysqli_query($db, $query);
    $r = mysqli_fetch_assoc($result);
    print(json_encode($r, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT|JSON_NUMERIC_CHECK));
}

function query_json_list($db, $query) {
    $result = mysqli_query($db, $query);
    $rows = [];
    while($r = mysqli_fetch_assoc($result)) {
        $rows[] = $r;
    }
    print(json_encode($rows, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT|JSON_NUMERIC_CHECK));
}

function query_json_list_return($db, $query) {
    $result = mysqli_query($db, $query);
    $rows = [];
    while($r = mysqli_fetch_assoc($result)) {
        $rows[] = $r;
    }
    return $rows;
}

function json($data) {
    print(json_encode($data, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT|JSON_NUMERIC_CHECK));
}

$db = database();

$action = $_REQUEST['action'];


if( (!isset($_SESSION["user"]) || $_SESSION["user"]["admin"] == 0) && isset($_REQUEST['username'])) {
    //http_response_code(403);

    // try to login again
    list($username, , $password) = get_values($db, ['username', 'password']);
    $username = mysqli_escape_string($db, $_REQUEST["username"]);
    $user = mysqli_fetch_assoc(mysqli_query($db, "SELECT * FROM user WHERE username = '$username' AND activated = 1"));
    $hash = $user["password"];
    if(phpbb_check_hash($_REQUEST["password"], $hash)) {
        $_SESSION["user"] = $user;
    }
}

if($action == "session") {
    if(isset($_SESSION["user"]))
        echo "{\"username\": \"".$_SESSION["user"]["username"]."\", \"role\": ".$_SESSION["user"]["role"].", \"admin\": ".$_SESSION["user"]["admin"]."}";
    else
        echo "{}";
    die();
}
else if($action == "login") {
    list($username, , $password) = get_values($db, ['username', 'password']);
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
    die();
}

if(!isset($_SESSION["user"]) || $_SESSION["user"]["admin"] == 0) {
    http_response_code(403);
    die();
}


if($action == "avatar") {
    $id = intVal($_REQUEST['id']);
    query_json($db,"SELECT * FROM avatar WHERE id = $id");
}
else if($action == "user_list") {
    $query = "SELECT user.id, user.username, user.role, user.email, user.regdate, user.activated, user.admin, COUNT(story.id) count FROM user LEFT JOIN story ON story.author = user.id GROUP BY user.id;";

    queryDatabase($query);
}
else if($action == "language_list") {
    $query = "SELECT * FROM language;";

    queryDatabase($query);
}
else if($action == "course_list") {
    $query = "SELECT * FROM course;";

    queryDatabase($query);
}
else if($action == "avatar_names") {
    $id = intVal($_REQUEST['id']);
    if($id == 0) {
        $course_id = intVal($_REQUEST['course_id']);
        query_json_list($db,"SELECT avatar_mapping.id AS id, a.id AS avatar_id, language_id, COALESCE(avatar_mapping.name, a.name) AS name, link, speaker FROM avatar_mapping RIGHT OUTER JOIN avatar a on avatar_mapping.avatar_id = a.id WHERE (language_id = (SELECT learningLanguage FROM course WHERE id = $course_id) or language_id is NULL) ORDER BY a.id");
    }
    else
        query_json_list($db,"SELECT avatar_mapping.id AS id, a.id AS avatar_id, language_id, COALESCE(avatar_mapping.name, a.name) AS name, link, speaker FROM (SELECT * FROM avatar_mapping WHERE language_id = $id) as avatar_mapping RIGHT OUTER JOIN avatar a on avatar_mapping.avatar_id = a.id ORDER BY a.id");
}
else if($action == "speakers") {
    $id = intVal($_REQUEST['id']);
    query_json_list($db,"SELECT * FROM speaker WHERE language_id = $id");
}
else if($action == "language") {
    $id = intVal($_REQUEST['id']);
    query_json($db,"SELECT * FROM language WHERE id = $id");
}
else if($action == "image") {
    $id = mysqli_escape_string($db, $_REQUEST['id']);
    query_json($db,"SELECT * FROM image WHERE id = \"$id\"");
}
else if($action == "import") {
    $id = intVal($_REQUEST['id']);
    $id2 = intVal($_REQUEST['id2']);
    query_json_list($db, "SELECT  s1.id, s1.set_id, s1.set_index, s1.name, image.gilded, image.active , COUNT(s2.id) copies
                          FROM story s1
                          LEFT JOIN (SELECT s2.duo_id, s2.id FROM story s2 WHERE s2.course_id = $id2) AS s2 ON s1.duo_id = s2.duo_id
                          JOIN image on image.id = s1.image
                          WHERE s1.course_id = $id
                          GROUP BY s1.id
                          ORDER BY s1.set_id, s1.set_index");
}
else if($action == "courses") {
    query_json_list($db,"SELECT course.id, course.name, l1.short AS fromLanguage, l1.name AS fromLanguageName, l1.flag_file AS fromLanguageFlagFile, l1.flag AS fromLanguageFlag,
                                                        l2.short AS learningLanguage, l2.name AS learningLanguageName, l2.flag_file AS learningLanguageFlagFile, l2.flag AS learningLanguageFlag,
                                                 COUNT(story.id) count, course.public, course.official FROM course
                    LEFT JOIN language l1 ON l1.id = course.fromLanguage
                    LEFT JOIN language l2 ON l2.id = course.learningLanguage
                    LEFT JOIN story ON (story.course_id = course.id AND story.deleted = 0)
                    GROUP BY course.id
                    ORDER BY COUNT DESC;");
}
else if($action == "course") {
    $id = intVal($_REQUEST['id']);
    $course = query_json_list_return($db,"SELECT course.id, course.name, course.fromLanguage as fromLanguageID, l1.short AS fromLanguage, l1.name AS fromLanguageName, l1.flag_file AS fromLanguageFlagFile, l1.flag AS fromLanguageFlag,
                                                                         course.learningLanguage as learningLanguageID, l2.short AS learningLanguage, l2.name AS learningLanguageName, l2.flag_file AS learningLanguageFlagFile, l2.flag AS learningLanguageFlag,
                                                                  course.public, course.official FROM course
                                      LEFT JOIN language l1 ON l1.id = course.fromLanguage
                                      LEFT JOIN language l2 ON l2.id = course.learningLanguage
                                      WHERE course.id = $id;");
    if(isset($course[0]))
        $course = $course[0];
      if(0)
        $stories = query_json_list_return($db,"SELECT story.id, story.set_id, story.set_index, story.name, story.status, story.image, story.image_done, story.xp, story.name_base, COUNT(done.id) count, user.username, story.date, story.change_date, story.public FROM story
        LEFT JOIN user ON story.author = user.id
        LEFT JOIN story_done done ON story.id = done.story_id
        WHERE story.course_id = $id
        GROUP BY story.id");
      else
        $stories = query_json_list_return($db,"SELECT COUNT(sa.id) as approvals, story.id, story.set_id, story.set_index, story.name, story.status, story.image, story.image_done, story.xp, story.name_base, user.username, story.date, story.change_date, story.public FROM story
                                               LEFT JOIN user ON story.author = user.id
                                               LEFT JOIN story_approval sa on story.id = sa.story_id
                                               WHERE story.course_id = $id AND deleted = false
                                               GROUP BY story.id
                                               ORDER BY story.set_id, story.set_index;
        ");
    $course["stories"] = $stories;
    json($course);
}
else if($action == "story") {
    $id = intVal($_REQUEST['id']);
    query_json($db,"SELECT story.id, c.official as official, course_id, duo_id, image, story.name, set_id, set_index, text, c.learningLanguage as learningLanguage, c.fromLanguage as fromLanguage FROM story JOIN course c on story.course_id = c.id WHERE story.id = $id");
}
else {
    echo "unknown action";
}
