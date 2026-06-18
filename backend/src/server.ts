import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ROTA TESTE
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend 123' });
});

app.listen(PORT, () => {
  console.log(`Servidor executando na porta ${PORT}`);
});