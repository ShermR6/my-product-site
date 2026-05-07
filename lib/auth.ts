import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
const bcrypt = require("bcryptjs");

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        loginToken: { label: "Login Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const email = credentials.email.toLowerCase();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        // 2FA login flow — loginToken issued after successful 2FA verification
        if (credentials.loginToken) {
          if (!user.pendingLoginToken || !user.pendingLoginExpiry) return null;
          if (new Date() > user.pendingLoginExpiry) return null;
          if (credentials.loginToken !== user.pendingLoginToken) return null;
          // Single-use: clear the token immediately
          await prisma.user.update({
            where: { id: user.id },
            data: { pendingLoginToken: null, pendingLoginExpiry: null },
          });
          return { id: user.id, email: user.email, name: user.name };
        }

        // Password login flow
        if (!credentials.password || !user.password) return null;
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        // If 2FA is enabled, block direct password login — must use 2FA flow
        const has2FA = user.twoFactorEmailEnabled || user.twoFactorSmsEnabled || user.twoFactorTotpEnabled;
        if (has2FA) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user }) {
      if (user.email) {
        user.email = user.email.toLowerCase();
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
};
