// Agrega a la petición de Express el usuario que dejó el middleware de sesión.
declare global {
  namespace Express {
    interface Request {
      usuario?: {
        id: string;
        email: string | null;
      };
    }
  }
}

export {};
