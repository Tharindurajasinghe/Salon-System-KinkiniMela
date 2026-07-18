import { cookies } from "next/headers";
import { Poppins, Playfair_Display } from "next/font/google";
import Providers from "@/components/providers/Providers";
import { DEFAULT_LANG } from "@/lib/i18n";
import "./globals.css";

// Load brand fonts once at the root and expose them as CSS variables.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

export const metadata = {
  title: "Salon | TAR Solutions",
  description: "Salon website and POS system",
};

export default function RootLayout({ children }) {
  // Read the language cookie on the server so the first paint is correct.
  const lang = cookies().get("lang")?.value || DEFAULT_LANG;

  return (
    <html lang={lang} className={`${poppins.variable} ${playfair.variable}`}>
      <body className="font-sans text-gray-800 antialiased">
        <Providers initialLang={lang}>{children}</Providers>
      </body>
    </html>
  );
}
