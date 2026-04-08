import React from "react";
import { cn } from "@/lib/utils";

function CheckButton({ type }: { type: string }) {
  const className = cn(
    "relative h-[42px] min-w-10 select-none rounded-[9px] border-2 border-b-4 border-[var(--color_base_border)] bg-[var(--color_base_background)] text-[var(--color_base_color)]",
    type === "done" &&
      "border-[var(--color_disabled_border-color)] border-b-2 bg-[var(--color_disabled_background)] text-[var(--color_disabled_color)]",
    type === "right" &&
      "border-[var(--color_right_border-color)] bg-[var(--color_right_background)] text-[var(--color_right_color)]",
    type === "false" &&
      "animate-[story-checkbutton-false-to-disabled_1.5s] border-[var(--color_disabled_border-color)] border-b-2 bg-[var(--color_disabled_background)] text-[var(--color_disabled_color)]",
  );

  return (
    <button className={className} data-cy="button" type="button">
      {type === "right" ? (
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url(//d35aaqx5ub95lt.cloudfront.net/images/867bf7feaeebef6c4938d14983f4f9df.svg)",
          }}
        />
      ) : null}
      {type === "false" ? (
        <>
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-center bg-no-repeat"
            style={{
              backgroundImage:
                "url(//d35aaqx5ub95lt.cloudfront.net/images/c854160d63716d5ccede79734b63f36b.svg)",
            }}
          />
          <span
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 z-[1] h-[30px] w-[30px] -translate-x-1/2 -translate-y-1/2 bg-center bg-no-repeat"
            style={{
              backgroundImage:
                "url(//d35aaqx5ub95lt.cloudfront.net/images/45590f17eefeed5ed18cef9ac9d1f7d2.svg)",
            }}
          />
        </>
      ) : null}
    </button>
  );
}

export default CheckButton;
