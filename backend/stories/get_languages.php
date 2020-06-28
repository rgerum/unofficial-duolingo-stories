<?php
session_start();
include('../functions_new.php');

$query = "
SELECT language.id, language.flag, language.public, language.short, language.name, COUNT(story.id) count FROM language
LEFT JOIN story ON story.lang = language.id
GROUP BY language.id
";

queryDatabase($query);

