import Image from "next/image";

export function Wordmark({ priority = false }: { priority?: boolean }) {
  return (
    <Image
      className="wordmark__image"
      src="/brand/china-in-fact-wordmark.svg"
      alt="China, in Fact"
      width={1497}
      height={274}
      priority={priority}
    />
  );
}
