import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

const formatAvatarForCookie = (avatarStr?: string | null) => {
  if (!avatarStr) return undefined;
  if (avatarStr.startsWith("data:") || avatarStr.length > 300) {
    return "/api/user/avatar";
  }
  return avatarStr;
};

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 48 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth",
  },
  callbacks: {
    async signIn({ user, account }: any) {
      if (account.provider === "google") {
        try {
          await connectToDatabase();
          const existingUser = await User.findOne({ email: user.email });

          if (!existingUser) {
            let idNumber = "";
            let isUnique = false;
            while (!isUnique) {
              idNumber = Math.floor(100000 + Math.random() * 900000).toString();
              const userWithId = await User.findOne({ idNumber });
              if (!userWithId) {
                isUnique = true;
              }
            }

            await User.create({
              name: user.name,
              email: user.email,
              avatar: user.image, // Google image
              role: "patient", // Default role
              idNumber,
            });
          } else {
            // Update avatar if it changed or was missing
            if (!existingUser.avatar || existingUser.avatar !== user.image) {
              existingUser.avatar = user.image;
              await existingUser.save();
            }
          }
          return true;
        } catch (error) {
          console.error("Error saving user to database:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger }: any) {
      if (user) {
        token.avatar = formatAvatarForCookie(user.image);
      }

      if (trigger === "update") {
        await connectToDatabase();
        const freshUser = await User.findOne({ email: token.email });

        if (freshUser) {
          token.name = freshUser.name;
          token.avatar = formatAvatarForCookie(freshUser.avatar);
          token.role = freshUser.role;
          token.gender = freshUser.gender;
        }
      } else if (token.email) {
        // Fetch user data on initial load if not already in token
        await connectToDatabase();
        const dbUser = await User.findOne({ email: token.email });
        if (dbUser) {
          token.avatar = formatAvatarForCookie(dbUser.avatar);
          token.role = dbUser.role;
          token.gender = dbUser.gender;
          token.id = dbUser._id.toString();
        }
      }

      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.avatar = token.avatar;
        session.user.image = token.avatar;
        session.user.role = token.role;
        session.user.gender = token.gender;
      }
      return session;
    },
  },
};
