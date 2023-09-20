const sqlite3 = require("sqlite3").verbose();
const fetch = require("node-fetch");
const fs = require("fs");

const data_url = "https://carex.uber.space/stories/test_data/";

// Create a new in-memory database
//const db = new sqlite3.Database(':memory:');
const db = new sqlite3.Database("test.sqlite");

// Create a table
async function query_create(structure_query) {
  return new Promise((resolve, reject) => {
    db.exec(structure_query, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function createAll() {
  const structure_query = await (
    await fetch(data_url + "structure.sql")
  ).text();

  await query_create(structure_query);

  async function add_data(database, filename) {
    let res = await fetch(data_url + filename);
    let data = await res.json();

    // Get the keys from the first object in the array
    const keys = Object.keys(data[0]);

    // Create the SQL statement dynamically
    const sql = `INSERT INTO ${database} (${keys.join(", ")}) VALUES (${keys
      .map(() => "?")
      .join(", ")})`;

    // Prepare the statement
    const stmt = db.prepare(sql);

    data.forEach((item) => {
      const values = keys.map((key) => item[key]);
      stmt.run(values);
    });

    console.log(filename, "added");
  }

  const write_envs = new Promise((resolve, reject) => {
    fs.writeFile(
      ".env.local",
      `NODE_ENV="test"\nNEXTAUTH_SECRET=1234`,
      (err) => {
        if (err) {
          console.error(err);
          reject(err);
        }
        // file written successfully
        else resolve("done");
      },
    );
  });

  await Promise.all([
    add_data("language", "language.json"),
    add_data("course", "course.json"),
    add_data("image", "image.json"),
    add_data("story", "story-nl-en.json"),
    add_data("story", "story-ca-en.json"),
    add_data("story", "story-es-en.json"),
    add_data("story", "story-test.json"),
    add_data("story_approval", "approvals.json"),
    add_data("avatar", "avatar.json"),
    add_data("user", "user.json"),
    add_data("course_tag_map", "course_tag_map.json"),
    write_envs,
  ]);
}
createAll().then(() => console.log("done"));
