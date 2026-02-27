import { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      from: "noreply@finalpingapp.com",
      sendVerificationRequest: async ({ identifier: email, url: rawUrl }) => {
        // Force redirect to /dashboard after clicking the magic link
        const url = rawUrl.includes("callbackUrl")
          ? rawUrl.replace(/callbackUrl=[^&]+/, "callbackUrl=%2Fdashboard")
          : `${rawUrl}&callbackUrl=%2Fdashboard`;
        await resend.emails.send({
          from: "FinalPing <noreply@finalpingapp.com>",
          to: email,
          subject: "Sign in to FinalPing",
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0b0b0b;color:#fff;border-radius:12px;">
              <div style="font-size:20px;font-weight:700;margin-bottom:8px;">FinalPing</div>
              <div style="font-size:14px;color:#bdbdbd;margin-bottom:24px;">Real-time aircraft tracking</div>
              <p style="font-size:15px;margin-bottom:24px;">Click the button below to sign in. This link expires in 24 hours.</p>
              <a href="${url}" style="display:inline-block;padding:12px 24px;background:#f5b400;color:#000;font-weight:700;border-radius:999px;text-decoration:none;font-size:14px;">Sign in to FinalPing</a>
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
};
