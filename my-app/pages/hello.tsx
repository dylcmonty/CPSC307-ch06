import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

const Hello: NextPage = () => {
    return (
        <div>
            <Head>
                <title>Hello World Page Title</title>
                <meta property="og:title" content="Hello World" key="title" />
            </Head>
            <div>Hello World!</div>
            <div>
                <a href="https://nostarch.com"> external link</a>
                and the Link component for an
                <Link href="/components/weather"> internal page</Link>.
            </div>
        </div>
    );
};

export default Hello;

