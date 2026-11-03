import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username / Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const identifier = String(credentials.username).trim();
        const password = String(credentials.password);

        try {
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { username: identifier },
                { email: identifier },
              ],
            },
          });

          if (!user) {
            console.warn(`[AUTH] Login failed: User not found for identifier "${identifier}"`);
            return null;
          }

          if (!user.isActive) {
            console.warn(`[AUTH] Login failed: User "${identifier}" is inactive / suspended`);
            return null;
          }

          const passwordValid = await bcrypt.compare(password, user.password);
          if (!passwordValid) {
            console.warn(`[AUTH] Login failed: Invalid password for user "${identifier}"`);
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
          };
        } catch (error) {
          console.error("[AUTH] Error in authorize function:", error);
          return null;
        }
      },
    }),
  ],
});
