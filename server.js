

/*const express = require("express");
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

// Variable para almacenar el mapeo de nombres originales y renombrados
let fileMapping = {};

// Servir archivos estáticos desde la carpeta "uploads"
app.use("/uploads", express.static(uploadsDir));

// Ruta para subir archivos
app.post("/upload", upload.single("docxFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No se subió ningún archivo");
  }

  // Guardar el mapeo de nombres originales y renombrados
  fileMapping[req.file.filename] = req.file.originalname;

  res.status(200).send("Archivo subido correctamente");
});

// Ruta para listar documentos con nombres originales
app.get("/documents", (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      return res.status(500).send("Error al leer los archivos");
    }

    // Mapeo de los archivos con sus nombres originales
    const filesWithNames = files.map((file) => {
      return {
        originalName: fileMapping[file] || file, // Si no existe el mapeo, devolver el nombre renombrado
        storedName: file,
      };
    });

    // Ordenar archivos por fecha de creación (más recientes primero)
    const sortedFiles = filesWithNames.sort((a, b) => b.storedName.localeCompare(a.storedName));
    res.json(sortedFiles); // Devolver la lista con los nombres originales y renombrados
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto exitoso ${PORT}`);
});
*/
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
const uploadsDir = path.join(__dirname, "uploads");
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
    const timestamp = Date.now(); // Timestamp para identificar el momento de subida
    cb(null, `${timestamp}${ext}`); // Renombrar archivo con un timestamp
  },
});

const upload = multer({ storage });

// Variable para almacenar el mapeo de nombres originales y fechas de subida
let fileMapping = {};

// Servir archivos estáticos desde la carpeta "uploads"
app.use("/uploads", express.static(uploadsDir));

// Ruta para subir archivos
app.post("/upload", upload.single("docxFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No se subió ningún archivo");
  }

  // Guardar el mapeo del nombre original y la fecha de subida
  const timestamp = parseInt(path.basename(req.file.filename, path.extname(req.file.filename)));
  fileMapping[req.file.filename] = { 
    originalName: req.file.originalname, 
    uploadedAt: timestamp 
  };

  res.status(200).send("Archivo subido correctamente");
});

// Ruta para listar documentos válidos (con duración de 1 mes)
app.get("/documents", (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      return res.status(500).send("Error al leer los archivos");
    }

    const oneMonthMs = 30 * 24 * 60 * 60 * 1000; // Duración de 1 mes en milisegundos
    const now = Date.now();

    // Filtrar y mapear los archivos válidos
    const validFiles = files
      .map((file) => {
        const fileData = fileMapping[file];
        if (!fileData) return null; // Ignorar archivos sin mapeo
        const { originalName, uploadedAt } = fileData;
        const isValid = now - uploadedAt < oneMonthMs; // Verificar si el archivo aún es válido
        return isValid ? { originalName, storedName: file } : null; // Devolver solo los archivos válidos
      })
      .filter(Boolean); // Eliminar valores nulos

    // Ordenar archivos por fecha de subida (más recientes primero)
    validFiles.sort((a, b) => b.uploadedAt - a.uploadedAt);

    res.json(validFiles); // Devolver la lista de archivos válidos
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
