import { useEffect, useState } from "react";

function App() {
  const [students, setStudents] = useState([]);
  const [file, setFile] = useState(null);

  // Fetch students from database
  const fetchStudents = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/students"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch students");
      }

      setStudents(data);

    } catch (error) {
      console.log("Fetch Error:", error);
      alert("Unable to fetch student data");
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Upload Excel file
  const handleUpload = async () => {
    if (!file) {
      alert("Please select an Excel file");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "http://localhost:5000/api/students/upload",
        {
          method: "POST",
          body: formData
        }
      );

      const result = await response.json();

      console.log("Server Response:", result);

      if (!response.ok) {
        alert("Error: " + result.message);
        return;
      }

      alert(
        result.message +
        "\nInserted: " + result.insertedRecords +
        "\nSkipped: " + result.skippedRecords
      );

      setFile(null);

      await fetchStudents();

    } catch (error) {
      console.log("Upload Error:", error);
      alert("Upload failed: " + error.message);
    }
  };

  return (
    <div>
      <h1>Students Management</h1>

      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button onClick={handleUpload}>
        Upload Excel
      </button>

      <h2>Student Data</h2>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Id</th>
            <th>Name</th>
            <th>Std</th>
            <th>School</th>
            <th>Age</th>
          </tr>
        </thead>

        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td>{student.id}</td>
              <td>{student.name}</td>
              <td>{student.std}</td>
              <td>{student.school}</td>
              <td>{student.age}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;