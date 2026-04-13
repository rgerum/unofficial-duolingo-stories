import * as React from "react";
import {
  Link as TanStackLink,
  notFound as tanstackNotFound,
  redirect as tanstackRedirect,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";

type LinkProps = Omit<React.ComponentPropsWithoutRef<"a">, "href"> & {
  href: string;
  activeClassName?: string;
  prefetch?: boolean;
};

export function Link({ href, children, ...props }: LinkProps) {
  const isExternal =
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:");

  if (isExternal) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }

  return (
    <TanStackLink to={href} {...props}>
      {children}
    </TanStackLink>
  );
}

export default Link;

export function useRouter() {
  const navigate = useNavigate();

  return React.useMemo(
    () => ({
      push: (href: string, _options?: { scroll?: boolean }) =>
        navigate({ to: href }),
      replace: (href: string, _options?: { scroll?: boolean }) =>
        navigate({ to: href, replace: true }),
      back: () => window.history.back(),
      forward: () => window.history.forward(),
      refresh: () => window.location.reload(),
    }),
    [navigate],
  );
}

export function usePathname() {
  return useLocation({
    select: (location) => location.pathname,
  });
}

export function useSearchParams() {
  const search = useLocation({
    select: (location) => location.search,
  });

  return React.useMemo(() => new URLSearchParams(search), [search]);
}

function getSegments(pathname: string) {
  return pathname.split("/").filter(Boolean);
}

export function useSelectedLayoutSegment() {
  const pathname = usePathname();
  return React.useMemo(() => getSegments(pathname)[0] ?? null, [pathname]);
}

export function useSelectedLayoutSegments() {
  const pathname = usePathname();
  return React.useMemo(() => getSegments(pathname), [pathname]);
}

export function redirect(to: string) {
  throw tanstackRedirect({ to });
}

export function notFound() {
  throw tanstackNotFound();
}
