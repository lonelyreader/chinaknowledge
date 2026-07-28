import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <p className="meta">404</p>
      <h1>Not found</h1>
      <Link className="text-link" href="/en">China, in Fact</Link>
    </main>
  );
}
