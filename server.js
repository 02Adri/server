

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
const cron = require("node-cron");

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

// Archivo para almacenar el mapeo de nombres
const fileMappingPath = path.join(__dirname, "fileMapping.json");

// Leer o inicializar el mapeo de archivos
let fileMapping = {};
if (fs.existsSync(fileMappingPath)) {
  fileMapping = JSON.parse(fs.readFileSync(fileMappingPath, "utf-8"));
}

// Guardar el mapeo en el archivo JSON
function saveFileMapping() {
  fs.writeFileSync(fileMappingPath, JSON.stringify(fileMapping, null, 2));
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
  if (!req.file) {
    return res.status(400).send("No se subió ningún archivo");
  }

  // Guardar mapeo con fecha de subida
  fileMapping[req.file.filename] = {
    originalName: req.file.originalname,
    uploadDate: new Date().toISOString(),
  };

  saveFileMapping();
  res.status(200).send("Archivo subido correctamente");
});

// Ruta para listar documentos con nombres originales
app.get("/documents", (req, res) => {
  const files = Object.entries(fileMapping).map(([storedName, data]) => ({
    storedName,
    originalName: data.originalName,
    uploadDate: data.uploadDate,
  }));

  // Ordenar archivos por fecha de creación (más recientes primero)
  files.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
  res.json(files);
});

// Programar limpieza de archivos expirados
cron.schedule("0 0 * * *", () => {
  const now = new Date();
  Object.keys(fileMapping).forEach((fileName) => {
    const fileData = fileMapping[fileName];
    const filePath = path.join(uploadsDir, fileName);
    const uploadDate = new Date(fileData.uploadDate);
    const ageInDays = (now - uploadDate) / (1000 * 60 * 60 * 24);

    if (ageInDays > 30 && fs.existsSync(filePath)) {
      // Eliminar archivo y actualizar mapeo
      fs.unlinkSync(filePath);
      delete fileMapping[fileName];
    }
  });

  saveFileMapping();
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
