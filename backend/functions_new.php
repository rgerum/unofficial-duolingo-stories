<?php
header('Access-Control-Allow-Origin: *');

header('Access-Control-Allow-Methods: GET, POST');

header("Access-Control-Allow-Headers: X-Requested-With");

function database() {
	$db = mysqli_connect("localhost", "carex", "5hfW-18MSXgYvjrewhbP", "carex_stories");
	$db->set_charset("utf8");
	return $db;
}

function sqlSafeString($param) {
    global $db;
    if($param === "undefined")
        return "NULL";
    // Hier wird wg. der grossen Verbreitung auf MySQL eingegangen
    return (NULL === $param ? "NULL" : '"'.mysqli_escape_string ($db, $param).'"');
}

function sqlSafeInt($param) {
    if($param == "")
        return "NULL";
    return (NULL === $param ? "NULL" : intVal ($param));
}

function sqlSafeFloat($param) {
    if($param == "")
        return "NULL";
    return (NULL === $param ? "NULL" : floatVal ($param));
}

function sqlSafeDate($param) {
    if($param == "")
        return "NULL";
    return sqlSafeString($param);
}

function sqlEscape($param, $type) {
    if($type == "int" || $type == "boool")
        return sqlSafeInt($param);
    if($type == "float")
        return sqlSafeFloat($param);
    if($type == "date")
        return sqlSafeDate($param);
    return sqlSafeString($param);
}

function formatTime($format, $time) {
	$day = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
	$day = $day[strftime("%u", $time)];
	$format = str_replace("%a", $day, $format);
	
	$month = ["", "Januar", "Februar", "M&auml;rz", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
	$month = $month[intval(strftime("%m", $time))];
	$format = str_replace("%B", $month, $format);
	return strftime($format, $time);
}

function formatDate($result) {
	$start = strtotime($result["date_start"]);
	$end = strtotime($result["date_end"]);
	setlocale(LC_TIME, "de_DE");
	if($end > $start + 24*60*60)
		return formatTime("%a, %e. %B %Y", $start)."-".formatTime("%a, %e. %B %Y", $end-3*60*60);
	return formatTime("%a, %e. %B %Y %H:%M", $start)."-".formatTime("%H:%M", $end);
}

function formatDateShort($result) {
	$start = strtotime($result["date_start"]);
	$end = strtotime($result["date_end"]);
	setlocale(LC_TIME, "de_DE");
	if($end > $start + 24*60*60)
		return formatTime("%a, %e. %B %Y", $start)."-".formatTime("%a, %e. %B %Y", $end-3*60*60);
	return formatTime("%a, %e. %B %Y", $start);
}

function getTextByName($name) {
	global $db;
	$result = mysqli_query($db, "SELECT text FROM `botanik_texts` WHERE name = \"$name\" LIMIT 1");

	if($result && mysqli_num_rows($result)) {
		$r = mysqli_fetch_assoc($result);
		return $r["text"];
	}
	return "";
}

function getToday()
{
    $name = date("d.m.y", time());
    $day = (int)substr($name, 0, 2);
    $month = (int)substr($name, 3, 2);
    $year = (int)substr($name, 6, 2);
    if(isset($_GET['day'])) $day = $_GET['day'];
    if(isset($_GET['month'])) $month = $_GET['month'];
    if(isset($_GET['year'])) $year = $_GET['year'];
    $date = mktime(0,0,0,$month,$day, $year);
    return $date;
}

function getDay()
{
    $name = date("d.m.y", time());
    if(isset($_GET['day'])) return $_GET['day'];
    return (int)substr($name, 0, 2);
}

function getMonth()
{
    $name = date("d.m.y", time());
    if(isset($_GET['month'])) return $_GET['month'];
    return (int)substr($name, 3, 2);
}

function getYear()
{
    $name = date("d.m.y", time());
    if(isset($_GET['year'])) return $_GET['year'];
    return (int)substr($name, 6, 2);
}

function checkAdmin() {
    // check whether the user is logged in
    session_start();
    if(!isset($_SESSION["user"]) || $_SESSION["user"]["role"] == 1) {
        http_response_code(403);
        die();
    }
}

function generateRandomString($length = 10) {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $charactersLength = strlen($characters);
    $randomString = '';
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[rand(0, $charactersLength - 1)];
    }
    return $randomString;
}

function getQuery($query, $just_one=false) {
    $db = database();

    $result = mysqli_query($db, $query);

    $rows = [];
    while($r = mysqli_fetch_assoc($result)) {
        $rows[] = $r;
    }
    if($just_one)
        $rows = $rows[0];

    $result->close();
    $db->close();
    return $rows;
}

function queryDatabase($query, $just_one=false) {
    $db = database();

    $result = mysqli_query($db, $query);

    $rows = [];
    while($r = mysqli_fetch_assoc($result)) {
        $rows[] = $r;
    }
    if($just_one)
        $rows = $rows[0];
    print(json_encode($rows, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT|JSON_NUMERIC_CHECK));

    $result->close();
    $db->close();
}

function updateDatabase($keys, $table, $data, $id_key="id") {
    global $db;
    // connect to database
    $db = database();

    // unset the id if it is none
    if(!isset($data[$id_key]) || $data[$id_key] == "")
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
            foreach ($data as $key => $value)
            {
                // check if the key is known
                if($key != "delete" && !isset($keys[$key]))
                    ;//echo "key $key not recognized!\n";
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
    //print($query); print("\n");

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
