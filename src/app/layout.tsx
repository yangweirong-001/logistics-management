import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '物流管理系统',
  description: '物流管理系统 - 区域参数配置、航班配置、目的港配置、航空路由配置、方数预估、主单发放、欠方余方查询',
  keywords: [
    '物流管理',
    '方数预估',
    '主单发放',
    '航空路由',
    '物流系统',
  ],
  authors: [{ name: 'Coze Code Team' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        {children}
      </body>
    </html>
  );
}
