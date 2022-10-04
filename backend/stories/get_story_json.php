<?php
include('../functions_new.php');
header('Content-Type: application/json');

if(isset($_GET['id'])) {
    $db = database();
    $id = sqlSafeInt($_GET['id']);
    $query = "SELECT l1.short AS fromLanguage, l2.short AS learningLanguage, story.id, story.json FROM story JOIN course c on story.course_id = c.id LEFT JOIN language l1 ON l1.id = c.fromLanguage
              LEFT JOIN language l2 ON l2.id = c.learningLanguage WHERE story.id = $id;";

    $row = getQuery($query, true);
    $id = $row["id"];
    //var_dump($row["id"]);
    $json = $row["json"];
    //var_dump($json);
    $data = json_decode($json);
    //var_dump($data);
    $data->{"id"} = $id;
    $data->{"fromLanguage"} = $row["fromLanguage"];
    $data->{"learningLanguage"} = $row["learningLanguage"];

    //$data["id"] = $id;

    print(json_encode($data, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT|JSON_NUMERIC_CHECK));
    //print($row["json"]);
}
