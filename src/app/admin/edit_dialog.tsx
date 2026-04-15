import React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription as UiDialogDescription,
  DialogTitle as UiDialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import StandardButton from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Root = Dialog;
export const Trigger = DialogTrigger;

export function Content({ children }: { children: React.ReactNode }) {
  return (
    <DialogContent showCloseButton={false}>
      <div className="relative overflow-x-hidden p-6 max-[700px]:p-4">
        {children}
        <DialogClose asChild>
          <button
            aria-label="Close"
            className="absolute right-0 top-0 m-2 grid place-content-center rounded-full bg-transparent p-2"
          >
            <span
              aria-hidden="true"
              className="inline-block h-[18px] w-[18px] align-middle"
              style={{
                backgroundImage:
                  "url(//d35aaqx5ub95lt.cloudfront.net/images/icon-sprite8.svg)",
                backgroundPosition: "-373px -154px",
              }}
            />
          </button>
        </DialogClose>
      </div>
    </DialogContent>
  );
}

export function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof UiDialogTitle>) {
  return <UiDialogTitle className={cn("mb-4", className)} {...props} />;
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof UiDialogDescription>) {
  return (
    <UiDialogDescription className={cn("mt-2.5 mb-5", className)} {...props} />
  );
}

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof StandardButton>
>(function EditDialogButton(props, ref) {
  return <StandardButton ref={ref} {...props} />;
});

export function Fieldset({
  className,
  ...props
}: React.FieldsetHTMLAttributes<HTMLFieldSetElement>) {
  return (
    <fieldset
      className={cn(
        "mb-2.5 grid w-full grid-cols-[110px_minmax(0,1fr)] items-center gap-x-4 gap-y-2 border-0 p-0 max-[700px]:grid-cols-1 max-[700px]:gap-y-1.5",
        className,
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "overflow-hidden text-right text-base whitespace-nowrap text-ellipsis max-[700px]:text-left",
        className,
      )}
      {...props}
    />
  );
}

const dialogInputClassName =
  "w-full min-w-0 rounded-2xl border-2 border-[var(--input-border)] bg-[var(--input-background)] px-4 py-2.5 text-base text-[var(--text-color)] outline-none";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, type, ...props }, ref) {
  if (type === "checkbox") {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          "h-5 w-5 min-w-5 justify-self-start rounded border-2 border-[var(--input-border)] bg-[var(--input-background)] p-0",
          className,
        )}
        {...props}
      />
    );
  }

  return (
    <input
      ref={ref}
      type={type}
      className={cn(dialogInputClassName, className)}
      {...props}
    />
  );
});

function InputArea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full min-w-0 rounded-2xl border-2 border-[var(--input-border)] bg-[var(--input-background)] px-4 py-2.5 text-base text-[var(--text-color)] outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function InputText({
  name,
  label,
  value,
  setValue,
}: {
  name: string;
  label: string;
  value: string;
  setValue: (x: string) => void;
}) {
  return (
    <Fieldset>
      <Label htmlFor={label}>{name}</Label>
      <Input
        id={label}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </Fieldset>
  );
}

export function InputTextArea({
  name,
  label,
  value,
  setValue,
}: {
  name: string;
  label: string;
  value: string;
  setValue: (x: string) => void;
}) {
  return (
    <Fieldset>
      <Label htmlFor={label}>{name}</Label>
      <InputArea
        id={label}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </Fieldset>
  );
}

export function InputBool({
  name,
  label,
  value,
  setValue,
}: {
  name: string;
  label: string;
  value: boolean;
  setValue: (x: boolean) => void;
}) {
  return (
    <Fieldset>
      <Label htmlFor={label}>{name}</Label>
      <Input
        type="checkbox"
        id={label}
        checked={value}
        onChange={(e) => setValue(e.target.checked)}
      />
    </Fieldset>
  );
}
