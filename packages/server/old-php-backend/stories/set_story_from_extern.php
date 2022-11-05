<?php
header('Access-Control-Allow-Origin: *');

header('Access-Control-Allow-Methods: GET, POST');

header("Access-Control-Allow-Headers: X-Requested-With");

//session_start();
include('../functions_new.php');

if(!isset($_SESSION["user"]) || $_SESSION["user"]["role"] == 0) {
    //http_response_code(403);
    //die();
}



function updateDatabase2($keys, $table, $data, $id_key="id") {
    global $db;
    // connect to database
    $db = database();

    // unset the id if it is none
    if($data[$id_key] == "")
        unset($data[$id_key]);

    // initialize arrays
    $fields = [];
    $values = [];

    // should we delete?
    if(isset($data['delete']))
    {
        // escape the id
        $id = sqlEscape($data[$id_key], $keys[$id_key]);
        // compose the query
        $query = "DELETE FROM $table WHERE $id_key = $id";
    }
    else
    {
        // have we an id we want to update?
        if(isset($data[$id_key]))
        {
            // iterate over keys
            foreach ($data as $key => $value)
            {
                // check if the key is known
                if($key != "delete" && !isset($keys[$key]))
                    echo "key $key not recognized!\n";
                else
                    // escape the value
                    $values[] = $key."=".sqlEscape($value, $keys[$key]);
            }
            // escape the id
            $id = sqlEscape($data[$id_key], $keys[$id_key]);
            // compose the key value pairs
            $values = implode(",", $values);
            // compose the query
            $query = "UPDATE $table SET $values WHERE $id_key = $id;";
        }
        else
        {
            // iterate over keys
            foreach ($_POST as $key => $value)
            {
                // check if the key is known
                if($key != "delete" && !isset($keys[$key]))
                    echo "key $key not recognized!\n";
                else
                {
                    // add the key and value to the lists
                    if($key != $id_key) {
                        $fields[] = $key;
                        $values[] = sqlEscape($value, $keys[$key]);
                    }
                }
            }
            // compose the query
            $query = "REPLACE into $table (".join(", ", $fields).") values(".join(", ", $values).");";
        }
    }
    // print the query
    print($query); print("\n");

    // submit the query
    $result = mysqli_query($db, $query);
    //print($result); print("\n");

    // print errors if there are some
    //print(mysqli_error($result));

    // close the query and the database
    //$result->close();
    //$db->close();
    if(isset($data[$id_key]))
        return $data[$id_key];
    return $db->insert_id;
}


$keys = ["id" => "int",
    "name" => "string",
    "name_base" => "string",
    "lang" => "string",
    "lang_base" => "string",
    "author" => "int",
    "change_date" => "string",
    "image" => "string",
    "image_done" => "string",
    "image_locked" => "string",
    "discussion" => "string",
    "xp" => "int",
    "duo_id" => "string",
    "cefr" => "string",
    "set_id" => "int",
    "set_index" => "int",
    "text" => "string"];


$id = updateDatabase2($keys, "story", $_POST, "id");

$query = "SELECT * FROM story WHERE id = $id LIMIT 1;";

queryDatabase($query);
