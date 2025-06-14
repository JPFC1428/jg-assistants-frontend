
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ Conectado a MongoDB Atlas"))
  .catch(err => console.error("❌ Error de conexión", err));

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
});
const User = mongoose.model('User', userSchema);

const assistantSchema = new mongoose.Schema({
  name: String,
  description: String,
});
const Assistant = mongoose.model('Assistant', assistantSchema);

app.use(cors());
app.use(bodyParser.json());

app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  const existingUser = await User.findOne({ username });
  if (existingUser) return res.status(400).json({ message: "El usuario ya existe." });
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword });
  await user.save();
  res.status(201).json({ message: "Usuario registrado con éxito." });
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ message: "Credenciales inválidas." });
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(401).json({ message: "Credenciales inválidas." });
  const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: "1h" });
  res.json({ token });
});

app.get("/api/assistants", async (req, res) => {
  const assistants = await Assistant.find();
  res.json(assistants);
});

app.post("/api/populate-assistants", async (req, res) => {
  await Assistant.deleteMany();
  await Assistant.insertMany([
    { name: "Asistentes 24/7", description: "Disponibilidad constante para atender tus necesidades." },
    { name: "Inteligencia Artificial", description: "Tecnología de vanguardia que aprende y se adapta." },
    { name: "Integraciones", description: "Conecta tus herramientas favoritas." },
  ]);
  res.json({ message: "Asistentes iniciales cargados." });
});

app.listen(PORT, () => console.log(`✅ Servidor backend profesional escuchando en puerto ${PORT}`));
