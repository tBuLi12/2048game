import { clear, time } from "console";
import { type NextPage } from "next";
import Head from "next/head";
import Link, { LinkProps } from "next/link";
import { PropsWithChildren, useEffect, useRef, useState } from "react";

import playIcon from "public/play.svg";
import Image from "next/image";

const Card = (props: PropsWithChildren<LinkProps>) => (
  <Link
    {...props}
    className="block flex h-16 w-48 items-center justify-center gap-4 rounded-xl bg-indigo-800 text-3xl text-white shadow-button hover:bg-indigo-900 md:h-64"
  >
    {props.children}
  </Link>
);

const Home: NextPage = () => {
  return (
    <>
      <div className="my-24 text-8xl text-white">2048</div>
      <div className="flex w-full max-w-xl flex-col items-center justify-between gap-12 md:flex-row">
        <Card href="/play">
          <Image src={playIcon} alt="play" />
          Play
        </Card>
        <Card href="/scores">My Scores</Card>
      </div>
    </>
  );
};

export default Home;
