import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <p className="meta">404</p>
      <h1>This page is not here.</h1>
      <Link className="button" href="/en">Return home</Link>
    </main>
  );
}
