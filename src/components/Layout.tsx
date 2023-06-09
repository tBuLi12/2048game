import Head from "next/head";

import { Quicksand } from "next/font/google";

const quicksand = Quicksand({ subsets: ["latin"] });

export const Layout = ({ children }: { children: React.ReactNode }) => (
  <>
    <Head>
      <title>2048!</title>
      <meta name="description" content="Generated by create-t3-app" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <main
      className={`flex min-h-screen flex-col items-center bg-zinc-900 py-4 text-white ${quicksand.className}`}
    >
      {children}
    </main>
  </>
);
