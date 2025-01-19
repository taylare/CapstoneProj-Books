import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "Book_Reviews",
  password: "123456",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// Fetch all books from the database
async function getBooks() {
  const result = await db.query("SELECT * FROM books ORDER BY date_read DESC");
  return result.rows;
}

// Fetch a single book by ID
async function getBookById(id) {
  const result = await db.query("SELECT * FROM books WHERE id = $1", [id]);
  return result.rows[0];
}

// Insert a new book into the database
async function addBook(book) {
  const { title, author, rating, date_read, notes, cover_image_url } = book;
  await db.query(
    "INSERT INTO books (title, author, rating, date_read, notes, cover_image_url) VALUES ($1, $2, $3, $4, $5, $6)",
    [title, author, rating, date_read, notes, cover_image_url]
  );
}

// Update a book's details
async function updateBook(id, book) {
  const { title, author, rating, date_read, notes } = book;
  await db.query(
    "UPDATE books SET title = $1, author = $2, rating = $3, date_read = $4, notes = $5 WHERE id = $6",
    [title, author, rating, date_read, notes, id]
  );
}

// Delete a book by ID
async function deleteBook(id) {
  await db.query("DELETE FROM books WHERE id = $1", [id]);
}

// Routes
app.get("/", async (req, res) => {
  const books = await getBooks();
  res.render("index", { books });
});

app.get("/add", (req, res) => {
  res.render("add");
});

app.post("/add", async (req, res) => {
  const { title, author, rating, date_read, notes } = req.body;
  let coverImageUrl = "";

  try {
    const response = await axios.get(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}`
    );
    if (response.data.docs.length > 0) {
      const coverId = response.data.docs[0].cover_i;
      coverImageUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
    }
  } catch (error) {
    console.error("Error fetching cover image:", error);
  }

  await addBook({ title, author, rating, date_read, notes, cover_image_url: coverImageUrl });
  res.redirect("/");
});

app.get("/edit/:id", async (req, res) => {
  const book = await getBookById(req.params.id);
  res.render("edit", { book });
});

app.post("/edit/:id", async (req, res) => {
  const { title, author, rating, date_read, notes } = req.body;
  await updateBook(req.params.id, { title, author, rating, date_read, notes });
  res.redirect("/");
});

app.post("/delete/:id", async (req, res) => {
  await deleteBook(req.params.id);
  res.redirect("/");
});





// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

