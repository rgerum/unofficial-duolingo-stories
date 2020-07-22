<?php
session_start();
include('../functions_new.php');

$query = "
SELECT language.id, language.rtl, language.flag_file, language.flag, language.public, language.short, language.name, language.speaker, COUNT(story.id) count FROM language
LEFT JOIN story ON story.lang = language.id
GROUP BY language.id
";

queryDatabase($query);

