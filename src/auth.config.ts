import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 jam (1 shift kerja), menggantikan default NextAuth yang 30 hari
    updateAge: 60 * 60,  // Refresh token setiap 1 jam jika pengguna sedang aktif
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      // Allow public access to login, offline page, PWA manifests, and service workers
      const isPublicPath =
        pathname === "/login" ||
        pathname === "/offline" ||
        pathname === "/manifest.webmanifest" ||
        pathname === "/manifest.json" ||
        pathname === "/sw.js";

      if (isPublicPath) {
        if (pathname === "/login" && isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      // Protect all other routes
      if (!isLoggedIn) {
        let from = nextUrl.pathname;
        if (nextUrl.search) {
          from += nextUrl.search;
        }
        return Response.redirect(
          new URL(`/login?callbackUrl=${encodeURIComponent(from)}`, nextUrl)
        );
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
        token.role = (user as any).role;
        token.isActive = (user as any).isActive;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).username = token.username;
        (session.user as any).role = token.role;
        (session.user as any).isActive = token.isActive;
      }
      return session;
    },
  },
  providers: [],
  secret: process.env.AUTH_SECRET || "tapaknet-standalone-erp-auth-secret-key-2026",
};
