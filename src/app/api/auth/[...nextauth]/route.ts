import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          avatar: profile.picture,
          role: 'PLAYER',
        }
      }
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        // Super Admin Login
        if (
          (credentials.username === 'Admin_2009' || credentials.username.toLowerCase() === 'admin_2009' || credentials.username === 'admin') &&
          credentials.password === 'Admin_2009@'
        ) {
          const adminUser = await prisma.user.findFirst({
            where: {
              OR: [
                { username: 'Admin_2009' },
                { email: 'admin@navoiyfootball.uz' },
              ]
            }
          });

          if (adminUser) {
            await prisma.user.update({
              where: { id: adminUser.id },
              data: {
                username: 'Admin_2009',
                password: await bcrypt.hash('Admin_2009@', 10),
                role: 'ADMIN'
              }
            });
            return {
              id: adminUser.id,
              email: adminUser.email,
              name: adminUser.name,
              role: "ADMIN"
            };
          } else {
            const newAdmin = await prisma.user.create({
              data: {
                username: 'Admin_2009',
                name: 'Super Admin',
                password: await bcrypt.hash('Admin_2009@', 10),
                role: 'ADMIN'
              }
            });
            return {
              id: newAdmin.id,
              email: newAdmin.email,
              name: newAdmin.name,
              role: "ADMIN"
            };
          }
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username }
        });

        if (!user || !user.password) {
          throw new Error("User not found or using OAuth");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'PLAYER';
      }
      
      if (token.email && !user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email }
        });
        if (dbUser) {
          token.role = dbUser.role;
        }
      }

      // Super Admin Override (if env variable is used)
      if (token.email && process.env.ADMIN_EMAIL && token.email === process.env.ADMIN_EMAIL) {
        token.role = 'ADMIN';
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id || token.sub;
        (session.user as any).role = token.role || 'PLAYER';
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
