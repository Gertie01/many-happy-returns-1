export const metadata = {
  title: "Many Happy Returns",
  description: "Gemini 2.0 Flash Experimental Image Generation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
