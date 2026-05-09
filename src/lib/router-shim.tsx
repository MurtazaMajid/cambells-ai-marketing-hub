import * as React from "react";
import {
  Link as TSLink,
  useLocation as useTSLocation,
  useRouter,
} from "@tanstack/react-router";

// Drop-in replacements for the react-router-dom APIs used by the original app.

export function Link(props: any) {
  // Cast to any so arbitrary path strings (with query) are accepted.
  return <TSLink {...props} to={props.to as any} />;
}

export function useLocation() {
  // TanStack returns ParsedLocation with .pathname — same shape we need.
  return useTSLocation();
}

export function useNavigate() {
  const router = useRouter();
  return (to: string) => router.navigate({ to: to as any });
}

export function useSearchParams(): readonly [URLSearchParams, (next: URLSearchParams) => void] {
  const params =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const set = (next: URLSearchParams) => {
    if (typeof window !== "undefined") {
      const url = `${window.location.pathname}?${next.toString()}`;
      window.history.replaceState({}, "", url);
    }
  };
  return [params, set] as const;
}
