import bcrypt from "bcryptjs";

const COSTO = 12;

export function hashPassword(plano: string): Promise<string> {
  return bcrypt.hash(plano, COSTO);
}

export function verificarPassword(plano: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plano, hash);
}
