const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de almacenamiento con multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

// Servir archivos estáticos
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Ruta para subir archivos
app.post("/upload", upload.single("file"), (req, res) => {
  res.status(200).send("Archivo subido");
});

// Ruta para listar documentos
app.get("/documents", (req, res) => {
  fs.readdir("uploads", (err, files) => {
    if (err) {
      return res.status(500).send("Error al leer los archivos");
    }
    res.json(files.sort((a, b) => b.localeCompare(a))); // Ordenar por más reciente
  });
});

// Iniciar servidor
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
