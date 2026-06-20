import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Isso é muito difícil, mas basicamente ele serve para proteger as rotas, se alguém descobrir a URL http://localhost:3001/favorites
// Sem ele a pessoa ia poder ler, alterar, favoritar, deletar algum conselho mesmo sem login. O auth é um código que roda no meio
// do caminho, por isso se chama middleware, no caso ele roda entre a requisição do usuário (logar) e a resposta final.
// Funciona assim: usuário faz login com sucesso (200) informando email e senha, o servidor valida e gera uma secreta, no caso
// JWT (JSON Web Token recomendado pelo professor) que é enviado para o front e sempre que o front precisar de algo como
// os favoritos ele precisa colocar esse token no header da requisição dentro de um campo chamado Authorization

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_123';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
    return;
  } // Aqui olha pra requisição e procura pelo autorization no cabeçalho, então se o canalha tentar burlar o site vai tomar 401

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({ error: 'Erro no formato do token.' });
    return;
  } // Pelo que vi é padrão de mercado (Sou mobile, tive que pesquisar) usar Bearer+RESTODOTOKEN, então aqui tá  
    // quebrando o token e vendo se vem o Bearer, se vier tá tranquilo, se não toma erro de novo

  const token = parts[1];

  if (!token) {
    res.status(401).json({ error: 'Token vazio.' });
    return;
  } // Aqui está vendo se authorization vem vazio

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }; // O servidor pega o token e tenta abrir usando
    req.userId = decoded.userId;                                         // a palavra chave guardada no .env (JWT_SECRET)
    next(); // Aqui fala que tá tudo certo !                             // Se for alterado ou expirado toma 403
  } catch (err) {
    res.status(403).json({ error: 'Token inválido ou expirado.' });
  }
} // Na linha 41 Se o token for legítimo o ID do usuário é extraído e injetamos a informação na requisição