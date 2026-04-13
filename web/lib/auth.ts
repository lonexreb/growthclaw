import { NextResponse } from "next/server";

const API_SECRET = process.env.API_SECRET;

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export function requireAuth(request: Request): void {
  if (!API_SECRET) {
    throw new AuthError("API_SECRET not configured. Set it in .env.local");
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    throw new AuthError("Missing Authorization header");
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || token !== API_SECRET) {
    throw new AuthError("Invalid API key");
  }
}

export function handleAuthError(err: unknown): NextResponse {
  if (err instanceof AuthError) {
    return NextResponse.json(
      { error: err.message },
      { status: err.message.includes("not configured") ? 500 : 401 }
    );
  }
  throw err;
}
