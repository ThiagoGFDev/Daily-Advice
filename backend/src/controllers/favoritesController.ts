import type { Response } from 'express';
import { z } from 'zod';
import { readDatabase, writeDatabase } from '../database.js'; 
import type { AuthenticatedRequest } from '../middlewares/auth.js';
import type { FavoriteAdvice } from '../models/types.js';

// Trabalha junto com o middleware, quando uma requisição chega aqui é porque o token já foi validado 

// Cria o molde no zod
const createFavoriteSchema = z.object({
  adviceId: z.number({ message: 'O ID do conselho deve ser um número válido.' }),
  advice: z.string().min(1, { message: 'O texto do conselho não pode estar vazio.' }),
  notes: z.string().optional()
});

// Validação para adicionar anotação
const updateFavoriteSchema = z.object({
  notes: z.string().min(1, { message: 'A anotação não pode ser vazia ao atualizar.' })
});

// Salvar conselho no favoritos 
export async function addFavorite(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Usuário não autenticado.' });
      return;
    }

    const validatedData = createFavoriteSchema.parse(req.body); // Zod valida se o front enviou o ID do conselho e o texto
    const db = await readDatabase();

    const alreadyFavorited = db.favorites.some(
      f => f.userId === userId && f.adviceId === validatedData.adviceId // Evita do usuário salvar o mesmo conselho
    );

    if (alreadyFavorited) {
      res.status(400).json({ error: 'Você já favoritou este conselho.' }); // Retorno se já tiver favoritado o mesmo conselho
      return;
    }

    // Monta o objeto que vai para o banco
    const newFavorite: FavoriteAdvice = {
      id: crypto.randomUUID(), // ID único gerado pelo servidor
      userId, // Vincula o favorito ao usuário logado
      adviceId: validatedData.adviceId,
      advice: validatedData.advice,
      notes: validatedData.notes || '' // Pode salvar sem anotações também
    };

    db.favorites.push(newFavorite);
    await writeDatabase(db); // Escreve no DB

    res.status(201).json({ message: 'Conselho favoritado com sucesso!', favorite: newFavorite });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.flatten().fieldErrors });
      return;
    }
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}

// Lista os favoritos do usuário logado
export async function getFavorites(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Usuário não autenticado.' });
      return;
    }

    const db = await readDatabase();
    const userFavorites = db.favorites.filter(f => f.userId === userId); //  Filtra no arquivo para trazer somente o que 
                                                                         // pertence a quem está logado
    res.json(userFavorites);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno ao buscar favoritos.' });
  }
}

// Atualiza as anotações de algum conselho
export async function updateFavorite(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const { id } = req.params; // Pega o ID do favorito via URL da requisição

    if (!userId) {
      res.status(401).json({ error: 'Usuário não autenticado.' });
      return;
    }

    const validatedData = updateFavoriteSchema.parse(req.body);
    const db = await readDatabase();

    const favoriteIndex = db.favorites.findIndex(f => f.id === id && f.userId === userId); // Procura o favorito e vê se o ID
                                                                                           // bate com do user logado
    if (favoriteIndex === -1) {
      res.status(404).json({ error: 'Conselho favoritado não encontrado ou acesso não autorizado.' });
      return;
    }

    // Atualiza apenas o campo de anotações o resto fica igual
    const currentFavorite = db.favorites[favoriteIndex];
    if (currentFavorite) {
      db.favorites[favoriteIndex] = {
        ...currentFavorite,
        notes: validatedData.notes
      };
    }

    await writeDatabase(db);
    res.json({ message: 'Anotação atualizada com sucesso!', favorite: db.favorites[favoriteIndex] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.flatten().fieldErrors });
      return;
    }
    res.status(500).json({ error: 'Erro interno ao atualizar.' });
  }
}

// Remove um conselho dos favoritos
export async function removeFavorite(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Usuário não autenticado.' });
      return;
    }

    const db = await readDatabase();
    const initialLength = db.favorites.length;

    db.favorites = db.favorites.filter(f => !(f.id === id && f.userId === userId)); //Filtra removendo o item correspondente 
                                                                                    // ao ID e ao Usuário logado
    if (db.favorites.length === initialLength) {
      res.status(404).json({ error: 'Conselho não encontrado ou acesso não autorizado.' });
      return;
    } // Se o tamanho da lista não mudou, significa que nada foi deletado. Provavelmente alguém tentando fraudar

    await writeDatabase(db);
    res.json({ message: 'Conselho removido dos favoritos com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno ao remover favorito.' });
  }
}