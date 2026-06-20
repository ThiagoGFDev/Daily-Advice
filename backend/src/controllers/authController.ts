import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { readDatabase, writeDatabase } from '../database.js'; // Lembrar do .js
import type { User } from '../models/types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_123';

// Aqui está criando um molde para o front, qualquer coisa que o usuário digitar e o front tentar enviar fora desse molde é barrado
const registerSchema = z.object({
  nome: z.string().min(1, { message: 'O nome é obrigatório.' }),
  sobrenome: z.string().min(1, { message: 'O sobrenome é obrigatório.' }),
  email: z.string().email({ message: 'Insira um e-mail válido.' }),
  senha: z.string().min(4, { message: 'A senha deve ter no mínimo 4 dígitos.' }),
  confirmarSenha: z.string().min(4)
}).refine((data) => data.senha === data.confirmarSenha, {
  message: 'As senhas não coincidem.',
  path: ['confirmarSenha']
});

// O mesmo só que agora para o login
const loginSchema = z.object({
  email: z.string().email({ message: 'Insira um e-mail válido.' }),
  senha: z.string().min(1, { message: 'A senha é obrigatória.' })
});

// Essa função intercepta o momento que o usuário clica no botão criar conta
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const validatedData = registerSchema.parse(req.body); // Analisa os dados que vieram na requisição, se falar vai direto pro catch
                                                          // Devolvendo os erros de validação estruturados acima
    const db = await readDatabase(); // Lê o arquivo db.json (banco de dados)

    const emailExists = db.users.some(user => user.email === validatedData.email);
    if (emailExists) {
      res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
      return;
    } // Checa se o email é único no banco usando o método some para varrer a lista de usuários no db

    // Criptografando a senha usando o bcrypt
    const hashedPassword = await bcrypt.hash(validatedData.senha, 10); // Embaralha a senha

    const newUser: User = {
      id: crypto.randomUUID(), // Gera um ID único em texto
      nome: validatedData.nome,
      sobrenome: validatedData.sobrenome,
      email: validatedData.email,
      senha: hashedPassword // Salva a senha embaralhada, nunca em texto puro
    };

    // Só agora salva de fato no db
    db.users.push(newUser);
    await writeDatabase(db);

    res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.flatten().fieldErrors });
      return;
    }
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}

// Essa função roda quando o usuário clica em entrar na página de login
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const validatedData = loginSchema.parse(req.body); // Valida se o formato de senha e email são válidos

    const db = await readDatabase();

    const user = db.users.find(u => u.email === validatedData.email); // Procura se existe um usuário com esse email no arquivo
    if (!user) {                                                      // Se não achar retorna 401
      res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(validatedData.senha, user.senha); // Verifica se a senha bate com o hash
    if (!isPasswordValid) {                                                        // Pega a senha digitada em texto puro, joga no
      res.status(401).json({ error: 'E-mail ou senha incorretos.' });              // Algoritmo e compara com o hash no db
      return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' }); // Cria o token JWT que expira em 1 dia

    res.json({ // Retorna para o front
      token,
      user: {
        nome: user.nome,
        sobrenome: user.sobrenome,
        email: user.email
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.flatten().fieldErrors });
      return;
    }
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}