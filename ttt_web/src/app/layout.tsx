import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tic-Tac-Two",
  description: "Tic-Tac-Two multiplayer web client",
};

const getRandomBrightColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i += 1) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const randomBrightBgColor = getRandomBrightColor();

  return (
    <html lang="en">
      <body style={{ backgroundColor: randomBrightBgColor }}>{children}</body>
    </html>
  );
}
