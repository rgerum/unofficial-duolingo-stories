export default function Header({ children }: { children: React.ReactNode }) {
  return (
    <header
      className={
        "py-[22px] text-center " +
        "[&>h1]:m-0 [&>h1]:mb-[18px] [&>h1]:text-center [&>h1]:text-[calc(36/16*1rem)] [&>h1]:font-bold [&>h1]:leading-[1.2] " +
        "[&>p]:mx-auto [&>p]:mb-4 [&>p]:max-w-[700px] [&>p]:text-center [&>p]:text-[calc(19/16*1rem)] [&>p]:leading-[1.5] " +
        "[&>p:last-child]:mb-0 " +
        "max-[480px]:[&>h1]:mb-[10px] max-[480px]:[&>h1]:text-[calc(25/16*1rem)] " +
        "max-[480px]:[&>p]:text-[calc(19/16*1rem)] max-[480px]:[&>p]:text-[var(--title-color-dim)] max-[480px]:[&_a]:text-[var(--title-color-dim)]"
      }
    >
      {children}
    </header>
  );
}
