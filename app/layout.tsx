import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { Metadata } from "next";
import { Lora } from "next/font/google";
import "./globals.css";

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "NannyAnna",
  description: "Practical childcare advice, resources and support from an experienced nanny.",
  icons: {
    icon: "/NAicon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${lora.className} h-full antialiased`}
    >
      <body className="bg-[#E8F3E8] text-[#2f2f2f]">
  <Header />
  {children}
  <Footer />
</body>
    </html>
  );
}