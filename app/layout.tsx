import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Digital Studio — Дигитални идеи в движение',description:'Интерактивно дигитално студио с оригинална 3D скулптура.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="bg"><body>{children}</body></html>}
