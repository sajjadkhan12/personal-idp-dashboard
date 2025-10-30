import type { AppProps } from 'next/app';
import Head from 'next/head';
import { Toaster } from 'react-hot-toast';
import '@/styles/globals.css';
import { ThemeProvider } from '../contexts/ThemeContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <Head>
        <title>Personal IDP Dashboard</title>
        <meta name="description" content="Internal Developer Portal Dashboard" />
      </Head>
      <Toaster position="top-right" />
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

