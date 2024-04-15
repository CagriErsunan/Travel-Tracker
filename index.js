import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "1234",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;
var userColor = "teal";

let userResults = await db.query("SELECT * FROM users");
console.log(userResults.rows);
let users=[]; 
userResults.rows.forEach(user=>{;
    users.push(user);
});

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries JOIN users ON visited_countries.user_id = users.id WHERE users.id= $1", [currentUserId]);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}
app.get("/", async (req, res) => {
  let thisColor = await db.query("SELECT color FROM users WHERE id = $1", [currentUserId]);
  userColor = thisColor.rows[0].color;
  const countries = await checkVisisted();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: userColor,
  });
});
app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (user_id, country_code) VALUES ($1, $2)",
        [currentUserId, countryCode]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});
app.post("/user", async (req, res) => {
  if (req.body.add === "new") {
    res.render("new.ejs");
  } else {
    currentUserId = req.body.user;
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html

  let name = req.body.name;
  //console.log(name);
  userColor=req.body.color;
  //console.log(req.body.color);
  let createdId = await db.query("INSERT INTO users (name, color) VALUES ($1, $2) RETURNING id", [name, userColor]);
  //console.log(createdId.rows[0].id);
  currentUserId = createdId.rows[0].id;
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
