'use client';
import Link from 'next/link';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="os-welcome"><p className="os-eyebrow">A little pause</p><h1>Let’s try<br/><em>that again.</em></h1><p className="os-welcome-copy">This page couldn’t load. Your saved progress is still here.</p><button className="os-primary" onClick={reset}>Try again</button><Link className="os-text-button" href="/home">Back to home</Link></main>}
