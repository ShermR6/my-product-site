import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      from: "noreply@skyping.xyz",
      sendVerificationRequest: async ({ identifier: email, url }) => {
        await resend.emails.send({
          from: "SkyPing <noreply@skyping.xyz>",
          to: email,
          subject: "Sign in to SkyPing",
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0b0b0b;color:#fff;border-radius:12px;">
              <div style="font-size:20px;font-weight:700;margin-bottom:8px;">SkyPing</div>
              <div style="font-size:14px;color:#bdbdbd;margin-bottom:24px;">Real-time aircraft tracking</div>
              <p style="font-size:15px;margin-bottom:24px;">Click the button below to sign in. This link expires in 24 hours.</p>
              <a href="${url}" style="display:inline-block;padding:12px 24px;background:#f5b400;color:#000;font-weight:700;border-radius:999px;text-decoration:none;font-size:14px;">Sign in to SkyPing</a>
              <p style="font-size:12px;color:#666;margin-top:24px;">If you didn't request this, you can safely ignore this email.</p>
            </div>
          `,
        });
      },
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
   session: {
    strategy: "database",
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
});

export { handler as GET, handler as POST };