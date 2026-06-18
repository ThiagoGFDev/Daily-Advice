export interface User {
  id: string;
  nome: string;      
  sobrenome: string; 
  email: string;     
  senha: string;     
}

export interface FavoriteAdvice {
  id: string;        
  userId: string;    
  adviceId: number;  
  advice: string;    
  notes?: string;    
}

export interface DatabaseSchema {
  users: User[];
  favorites: FavoriteAdvice[];
}