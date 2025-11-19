import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Vérification simple : est-ce que ça correspond au .env ?
        if (
          credentials.email === process.env.ADMIN_EMAIL &&
          credentials.password === process.env.ADMIN_PASSWORD
        ) {
          // Si oui, on retourne l'utilisateur
          return { id: "1", name: "Admin Simon", email: credentials.email };
        }
        // Sinon, échec
        return null;
      }
    })
  ],
  pages: {
    signIn: '/login', // On dit à NextAuth d'utiliser notre page perso
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };