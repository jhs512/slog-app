import RootLayout from "../RootLayout";

export { metadata } from "../RootLayout";

// 별도 루트 레이아웃을 사용해 홈을 떠날 때 광고 런타임도 문서와 함께 폐기한다.
export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RootLayout adsEnabled>{children}</RootLayout>;
}
