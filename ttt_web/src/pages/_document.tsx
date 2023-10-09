import { Html, Head, Main, NextScript } from "next/document";

// Utility function to generate a random bright color
const getRandomBrightColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export default function Document() {

  const randomBrightBgColor = getRandomBrightColor();

  return (
    <Html lang="en">
      <Head />
      <body
        style={{
          backgroundColor: `${randomBrightBgColor}`,
          
        }}
      >
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
