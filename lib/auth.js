import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "./prisma";
import bcrypt from "bcryptjs";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      },
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.avatarUrl || user.image,
          isApproved: user.isApproved
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login", // Error code passed in query string as ?error=
    newUser: "/auth/role-setup", // Redirect new OAuth users here
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (!account) return true;
        
        // Handle OAuth sign-ins (Google)
        if (account.provider === "google") {
          // Check if user exists with this email
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { accounts: true }
          }).catch(err => {
            console.error("Database error in signIn:", err);
            return null;
          });

          if (existingUser) {
            // Existing user logging in with OAuth
            // Check if this Google account is already linked
            const accountExists = existingUser.accounts?.some(
              acc => acc.provider === "google" && acc.providerAccountId === account.providerAccountId
            );

            if (!accountExists) {
              // Link the Google account to existing user
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  refresh_token: account.refresh_token,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: account.session_state,
                }
              }).catch(err => {
                console.error("Error creating account link:", err);
              });
            }
            
            // Update user info from Google
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                name: user.name || existingUser.name,
                image: user.image || existingUser.image,
                emailVerified: new Date(),
              }
            }).catch(err => {
              console.error("Error updating user:", err);
            });
            
            // Existing user - update the user object to include role and approval status
            user.role = existingUser.role;
            user.isApproved = existingUser.isApproved;
          }
          // New OAuth user - will be created by adapter without a role (NULL)
          // isApproved will default to false
          // They will be redirected to /auth/role-setup via pages.newUser config
          
          return true;
        }
        
        // Allow credentials sign-ins
        if (account.provider === "credentials") {
          // Fetch user from database to get approval status
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { isApproved: true, role: true }
          }).catch(err => {
            console.error("Error fetching user in signIn:", err);
            return null;
          });
          
          if (dbUser) {
            user.isApproved = dbUser.isApproved;
            user.role = dbUser.role;
          }
          
          return true;
        }
        
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        // Allow sign-in to proceed even if there's an error
        return true;
      }
    },
    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.isApproved = user.isApproved !== undefined ? user.isApproved : false;
      }
      
      // Handle session updates (when update() is called)
      if (trigger === "update" && session) {
        if (session.user.name) token.name = session.user.name;
        if (session.user.role) token.role = session.user.role;
        if (session.user.image) token.picture = session.user.image;
        if (session.user.isApproved !== undefined) token.isApproved = session.user.isApproved;
        
        // Fetch fresh data from database to ensure accuracy
        if (session.user.email || token.email) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: session.user.email || token.email },
              select: { role: true, isApproved: true }
            });
            if (dbUser) {
              token.role = dbUser.role;
              token.isApproved = dbUser.isApproved;
            }
          } catch (error) {
            console.error("Error fetching user in jwt callback:", error);
          }
        }
      }
      
      // Return previous token if the user is already signed in
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.image = token.picture;
        session.user.isApproved = token.isApproved;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};

// Helper function to hash passwords
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

// Helper function to verify passwords
export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}
