import RootLayout from "../RootLayout";

export { metadata } from "../RootLayout";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RootLayout>{children}</RootLayout>;
}
