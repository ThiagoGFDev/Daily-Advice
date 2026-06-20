import { Router } from 'express';
import { addFavorite, getFavorites, updateFavorite, removeFavorite } from '../controllers/favoritesController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

// Usa o middleware em todas as rotas desse arquivo para garantir que o usuário só aplique o CRUD nos seus próprios favoritos
router.use(authMiddleware);

router.post('/', addFavorite);      
router.get('/', getFavorites);       
router.put('/:id', updateFavorite);  
router.delete('/:id', removeFavorite); 

export default router;