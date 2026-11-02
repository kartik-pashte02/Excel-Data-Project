const XLSX = require("xlsx");
const pool = require("./db");

async function importexcelData() {
try{
       const workbook = XLSX.readFile("./uploads/Book1.xlsx");
       const sheet = workbook.Sheets[workbook.SheetNames[0]];
       const data = XLSX.utils.sheet_to_json(sheet);
           console.log(data);

        for(const row of data) {
            await pool.query(
                `INSERT INTO students (Name, Std, School, Age)
                VALUES ($1,$2,$3,$4)`,
                [row.Name, row.Std, row["School Name"], row.Age]
            );
        }
        
     console.log("Excel data inserted successfully!");
    }
    catch(error){
        console.log("Error:", error.message);
     }
     finally{
        await pool.end();

     }
    }

    importexcelData();



