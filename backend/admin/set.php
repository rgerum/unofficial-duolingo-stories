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
function query_id($db, $query) {
    $result = mysqli_query($db, $query);
    $r = mysqli_fetch_assoc($result);
    return $r["id"];
}

function query_one($db, $query) {
    $result = mysqli_query($db, $query);
    return mysqli_fetch_assoc($result);
}

function execute($command) {
    echo "> ";
    echo $command;
    echo "\n";
    passthru("export PATH=/home/carex/.local/bin:/home/carex/bin:/opt/uberspace/etc/carex/binpaths/ruby:/opt/rh/devtoolset-9/root/usr/bin:/home/carex/.cargo/bin:/home/carex/.luarocks/bin:/home/carex/go/bin:/home/carex/.deno/bin:/home/carex/.config/composer/vendor/bin:/usr/local/bin:/usr/bin:/usr/local/sbin:/usr/sbin:/home/carex/.dotnet/tools: && $command 2>&1");
}

$db = database();



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
    unset($_REQUEST["password"]);
    unset($_REQUEST["username"]);
    unset($_POST["password"]);
    unset($_POST["username"]);
}

if(!isset($_SESSION["user"]) || $_SESSION["user"]["admin"] == 0) {
    http_response_code(403);
    die();
}

$action = $_REQUEST['action'];
if($action == "import") {
    $id = intVal($_REQUEST['id']);
    $course_id = intVal($_REQUEST['course_id']);
    $data = query_one($db, "SELECT * FROM story WHERE id = $id;");
    unset($data["id"]);
    unset($data["change_date"]);
    unset($data["date"]);
    if(isset($_SESSION["user"]))
        $data["author"] = $_SESSION["user"];
    else
        $data["author"] = 2;
    $data["course_id"] = $course_id;

    $keys = ["id" => "int",
            "duo_id" => "string",
            "name" => "string",
    #        "name_base" => "string",
    #        "lang" => "string",
    #        "lang_base" => "string",
            "author" => "int",
            "change_date" => "string",
            "image" => "string",
    #        "image_done" => "string",
    #        "image_locked" => "string",
    #        "discussion" => "string",
    #        "xp" => "int",
    #        "cefr" => "string",
            "set_id" => "int",
            "set_index" => "int",
            "course_id" => "int",
            "text" => "string",
            "json" => "string",
            "api" => "int"];

    if((!isset($_POST["author"]) || $_POST["author"] == "") && isset($_SESSION["user"]))
        $_POST["author"] = $_SESSION["user"]["id"];

    $id = updateDatabase($keys, "story", $data, "id");
    echo $id;

    $data = query_one($db, 'SELECT text,name,course_id, id FROM story WHERE id = '.$id.';');

    $newfile = fopen($id.".txt", "w");
    $str = $data["text"];
    fwrite($newfile, $str);
    fclose($newfile);

    $output=null;
    $retval=null;
    if(isset($_SESSION["user"])) {
        $author_name = '"duolingo"';
        $message = '"added '.$data["name"].' in course '.$data["course_id"].'"';
    }
    exec("python3 upload_github.py $id $data[course_id] $author_name $message", $output, $retval);
    //print_r($output);
}
else if($action == "user_activate") {
    $user_id = sqlSafeInt($_REQUEST['id']);
    $activated = sqlSafeInt($_REQUEST['activated']);

    $query = "UPDATE user SET activated = $activated WHERE user.id = $user_id;";
    //echo $query;
    mysqli_query($db, $query);

    echo mysqli_affected_rows($db);
}
else if($action == "user_write") {
    $user_id = sqlSafeInt($_REQUEST['id']);
    $write = sqlSafeInt($_REQUEST['write']);

    $query = "UPDATE user SET role = $write WHERE user.id = $user_id;";
    //echo $query;
    mysqli_query($db, $query);

    echo mysqli_affected_rows($db);
}
else if($action == "language") {
    $keys = ["id" => "int",
        "name" => "string",
        "short" => "string",
        "flag" => "string",
        "flag_file" => "string",
        "rtl" => "int",
        "speaker" => "string",
];
    $id = updateDatabase($keys, "language", $_POST, "id");
}
else if($action == "course") {
    $keys = ["id" => "int",
        "learningLanguage" => "int",
        "fromLanguage" => "int",
        "public" => "int",
        "name" => "string",
        "official" => "int",
        "conlang" => "int",
        "about" => "string",
];
    $id = updateDatabase($keys, "course", $_POST, "id");

    mysqli_query($db, "UPDATE course JOIN language l on l.id = course.fromLanguage JOIN language l2 on l2.id = course.learningLanguage
                       SET course.short = CONCAT(l2.short, "-", l.short)
                       WHERE course.id = $_POST[id];");
}
else if($action == "sync_flags") {
     chdir("../../github/");

     execute("pwd");

     execute("git fetch origin master && git reset --hard FETCH_HEAD");
     execute("rsync -av flags/ ../flags");
}
else if($action == "sync_editor") {
     chdir("../../github/");
     execute("pwd 2>&1");

     execute("git fetch origin master && git reset --hard FETCH_HEAD");

     execute("lerna bootstrap");
     execute("npm run build");

     execute("rsync -av packages/editor-app/dist/ ../editor/ ");
     execute("rsync -av packages/editor-app/public/icons/ ../editor/icons/ ");
}
else if($action == "sync_stories") {
     chdir("../../github/");
     execute("pwd 2>&1");

     execute("git fetch origin master && git reset --hard FETCH_HEAD");

     execute("lerna bootstrap");
     execute("npm run build");

     execute("rsync -av packages/stories-app/build/ ../ ");
}
else if($action == "sync_voice_list") {
     execute("python3 set_all_voices.py");
}
else if($action == "avatar") {
    $keys = ["id" => "int",
        "name" => "string",
        "speaker" => "string",
        "language_id" => "int",
        "avatar_id" => "int",
    ];
    $id = updateDatabase($keys, "avatar_mapping", $_POST, "id");
}
else if($action == "status") {
    $keys = ["id" => "int",
        "status" => "string",
    ];
    $id = updateDatabase($keys, "story", $_POST, "id");
}
else if($action == "approve") {
    $story_id = intVal($_REQUEST['story_id']);
    $keys = [
        "story_id" => "int",
    ];
    $user_id = $_SESSION["user"]["id"];

    if(mysqli_num_rows(mysqli_query($db, "SELECT id FROM story_approval WHERE story_id = $story_id AND user_id = $user_id;"))) {
       mysqli_query($db, "DELETE FROM story_approval WHERE story_id = $story_id AND user_id = $user_id;");
    }
    else {
        mysqli_query($db, "INSERT INTO story_approval (story_id, user_id) VALUES ($story_id, $user_id);");
    }

    $data = query_one($db, "SELECT COUNT(id) as count FROM story_approval WHERE story_id = $story_id;");
    echo $data["count"];
}
else if($action == "story") {
    $keys = ["id" => "int",
        "duo_id" => "string",
        "name" => "string",
#        "name_base" => "string",
#        "lang" => "string",
#        "lang_base" => "string",
        "author" => "int",
        "change_date" => "string",
        "image" => "string",
#        "image_done" => "string",
#        "image_locked" => "string",
#        "discussion" => "string",
#        "xp" => "int",
#        "cefr" => "string",
        "set_id" => "int",
        "set_index" => "int",
        "course_id" => "int",
        "text" => "string",
        "json" => "string",
        "api" => "int"];
    $_POST["api"] = 2;
    if(!isset($_POST["id"])) {
        $_POST["id"] = query_id($db, 'SELECT id FROM story WHERE API = 2 AND duo_id = "'.mysqli_escape_string ($db, $_POST['duo_id']).'" AND course_id = '.intVal($_POST['course_id']).";");
    }

    if((!isset($_POST["author"]) || $_POST["author"] == "") && isset($_SESSION["user"]))
        $_POST["author"] = $_SESSION["user"]["id"];

    //unset($_POST["author"]);
    echo "send...\n";
    echo "\n";
    $id = updateDatabase($keys, "story", $_POST, "id");
    echo $id;

    $newfile = fopen($id.".txt", "w");
    $str = $_POST["text"];
    fwrite($newfile, $str);
    fclose($newfile);

    $output=null;
    $retval=null;
    if(isset($_SESSION["user"])) {
        $author_name = '"'.$_SESSION["user"]["username"].'"';
        $message = '"updated '.$_POST["name"].' in course '.$_POST["course_id"].'"';
        exec("python3 upload_github.py $id $_POST[course_id] $author_name $message", $output, $retval);
    }
}
else if($action == "story_delete") {
    $keys = ["id" => "int"];
    $id = intVal($_REQUEST['id']);
    query_one($db, "UPDATE story SET deleted = 1 WHERE id = $id;");
    //echo "UPDATE story SET deleted = 1 WHERE id = $id;";
    //query_one($db, "DELETE FROM story WHERE id = $id;");

    $newfile = fopen($id.".txt", "w");
    $str = $_POST["text"];
    fwrite($newfile, $str);
    fclose($newfile);

    $output=null;
    $retval=null;
    if(isset($_SESSION["user"])) {
        $author_name = '"'.$_SESSION["user"]["username"].'"';
        $message = '"delete '.$_POST["name"].' from course '.$_POST["course_id"].'"';
    }
    exec("python3 upload_github.py $id $_POST[course_id] $author_name $message delete", $output, $retval);
}
else {
    echo "unknown action";
}
