import { Inter } from "next/font/google";
import "./globals.css";
import Provider from "../components/SessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Crypto Manager", 
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Provider>
          {children}
        </Provider>
      </body>
    </html>
  );
}