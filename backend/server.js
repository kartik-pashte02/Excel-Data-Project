const multer = require("multer");
const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");
const express = require("express");
const cors = require("cors");
const pool =require("./db");

const app = express();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename : (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Excel Data Import Backend is Running! ");
});
const PORT = 5000;


app.listen(PORT, async () => {
    console.log(`server is running on port ${PORT} `);

try {
    const result = await pool.query("SELECT NOW()");
    console.log("postgresSQl conected successfully!");
    console.log(result.rows[0]);
} catch (error){
      console.log("Database Connection Failed", error.message);
}

});

app.get("/api/students", async (req,res) => {
    try{
        const results = await pool.query("SELECT * FROM students");
        console.log(results.rows);
        res.json(results.rows);
    }catch(error){
        console.log("GET ERROR:", error);
        res.status(500).json({
            message: error.message
        });
    }
});


app.post("/api/students/upload", upload.single("file"), async (req, res) => {
  const client = await pool.connect();

  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please upload an Excel file"
      });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      return res.status(400).json({
        message: "Excel file is empty"
      });
    }

    const requiredColumns = [
      "Name",
      "Std",
      "School Name",
      "Age"
    ];

    const columns = Object.keys(data[0]);

    const missingColumns = requiredColumns.filter(
      (column) => !columns.includes(column)
    );

    if (missingColumns.length > 0) {
      return res.status(400).json({
        message: "Missing columns",
        columns: missingColumns
      });
    }

    await client.query("BEGIN");

    let insertedRecords = 0;

    for (const row of data) {
      if (
        !row.Name ||
        !row.Std ||
        !row["School Name"] ||
        !Number.isFinite(Number(row.Age))
      ) {
        throw new Error("Invalid or missing student data");
      }

      const result = await client.query(
  `INSERT INTO students (name, std, school, age)
   SELECT $1::VARCHAR, $2::VARCHAR, $3::VARCHAR, $4::INTEGER
   WHERE NOT EXISTS (
     SELECT 1 FROM students
     WHERE name = $1::VARCHAR
     AND std = $2::VARCHAR
     AND school = $3::VARCHAR
     AND age = $4::INTEGER
   )`,
  [
    String(row.Name).trim(),
    String(row.Std).trim(),
    String(row["School Name"]).trim(),
    Number(row.Age)
  ]
);

      insertedRecords += result.rowCount;
    }

    await client.query("COMMIT");

    res.json({
      message: "Excel uploaded successfully!",
      totalRecords: data.length,
      insertedRecords
    });

  } catch (error) {
    await client.query("ROLLBACK");

    res.status(500).json({
      message: error.message
    });

  } finally {
    client.release();
  }
});