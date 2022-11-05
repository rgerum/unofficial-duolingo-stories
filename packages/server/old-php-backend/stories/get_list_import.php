<?php
session_start();
include('../functions_new.php');

if(isset($_GET['lang']) && isset($_GET['lang_base'])) {
    $db = database();
    $lang = sqlSafeString($_GET['lang']);
    $lang_base = sqlSafeString($_GET['lang_base']);
    $lang2 = sqlSafeString($_GET['lang2']);
    $lang_base2 = sqlSafeString($_GET['lang_base2']);
    $query = "
    SELECT  s1.id, s1.set_id, s1.set_index, s1.image, s1.image_done, s1.name_base
    , COUNT(s2.id) copies
    FROM story s1
    LEFT JOIN (SELECT s2.duo_id, s2.id FROM story s2 WHERE s2.lang = (SELECT l.id FROM language l WHERE l.short = $lang2) AND s2.lang_base = (SELECT l.id FROM language l WHERE l.short = $lang_base)) AS s2 ON s1.duo_id = s2.duo_id
    WHERE s1.lang = (SELECT l.id FROM language l WHERE l.short = $lang)
    AND s1.lang_base = (SELECT l.id FROM language l WHERE l.short = $lang_base)
    GROUP BY s1.id
    ORDER BY s1.set_id, s1.set_index
;
";

    queryDatabase($query);
}
