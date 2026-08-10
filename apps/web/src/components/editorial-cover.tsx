export function EditorialCover({ title }: { title: string }) {
  return (
    <span className="editorial-cover" aria-label={title}>
      <span>China, in Fact</span>
      <strong>{title}</strong>
    </span>
  );
}
