import type { AppProps } from 'next/app';
import Head from 'next/head';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Personal IDP Dashboard</title>
        <meta name="description" content="Internal Developer Portal Dashboard" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

