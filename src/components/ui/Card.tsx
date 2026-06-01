import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

export function Card({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={clsx(
        "rounded-2xl border border-stone-200 bg-white p-5 shadow-sm",
        className,
      )}
    />
  );
}
