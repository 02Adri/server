const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de CORS
app.use(
  cors({
    origin: "https://diazprueba.netlify.app", // Origen permitido
    methods: ["GET", "POST"], // Métodos permitidos
    allowedHeaders: ["Content-Type", "Authorization"], // Encabezados permitidos
  })
);

// Middlewares para parsear JSON y datos de formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Asegúrate de que la carpeta 'uploads' exista antes de intentar guardar archivos
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de almacenamiento con multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); // Carpeta donde se almacenarán los archivos
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // Obtener la extensión del archivo
    cb(null, `${Date.now()}${ext}`); // Renombrar archivo con un timestamp
  },
});

const upload = multer({ storage });

// Servir archivos estáticos desde la carpeta "uploads"
app.use("/uploads", express.static(uploadsDir));

// Ruta para subir archivos
app.post("/upload", upload.single("docxFile"), (req, res) => {
  // "docxFile" debe coincidir con el nombre del campo en el FormData del frontend
  if (!req.file) {
    return res.status(400).send("No se subió ningún archivo");
  }
  res.status(200).send("Archivo subido correctamente");
});

// Ruta para listar documentos
app.get("/documents", (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      return res.status(500).send("Error al leer los archivos");
    }
    // Ordenar archivos por fecha de creación (más recientes primero)
    const sortedFiles = files.sort((a, b) => b.localeCompare(a));
    res.json(sortedFiles);
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
