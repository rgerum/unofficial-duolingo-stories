import styled from "styled-components";
import React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription as UiDialogDescription,
  DialogTitle as UiDialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Root = Dialog;
export const Trigger = DialogTrigger;

export function Content({ children }: { children: React.ReactNode }) {
  return (
    <DialogContent showCloseButton={false}>
      <ContentInner>
        {children}
        <DialogClose asChild>
          <IconButton aria-label="Close">
            <X />
          </IconButton>
        </DialogClose>
      </ContentInner>
    </DialogContent>
  );
}

export const DialogTitle = styled(UiDialogTitle)`
  margin: 0 0 16px;
`;

export const DialogDescription = styled(UiDialogDescription)`
  margin: 10px 0 20px;
`;

export const Button = styled.button`
  text-transform: uppercase;
  padding: 13px 30px;
  background: var(--button-background);
  border-radius: 15px;
  font-weight: 700;
  font-size: 1rem;

  color: var(--button-color);
  border-color: var(--button-border);
  border: none;
  border-bottom: 4px solid var(--button-border);
`;

const ContentInner = styled.div`
  position: relative;
  padding: 25px;
  overflow-x: hidden;

  @media (max-width: 700px) {
    padding: 16px;
  }
`;

const IconButton = styled.button`
  background: none;
  border: none;
  display: grid;
  place-content: center;
  position: absolute;
  top: 0;
  right: 0;
  padding: 8px;
  margin: 8px;
  border-radius: 100vw;
`;

export const Fieldset = styled.fieldset`
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr);
  column-gap: 16px;
  row-gap: 8px;
  align-items: center;
  border: 0;
  width: 100%;
  padding: 0;
  margin: 0 0 10px;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
    row-gap: 6px;
    margin-bottom: 10px;
  }
`;

export const Label = styled.label`
  font-size: calc(16 / 16 * 1rem);
  text-align: right;

  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  @media (max-width: 700px) {
    text-align: left;
  }
`;

export const Input = styled.input`
  background: var(--input-background);
  border: 2px solid var(--input-border);
  color: var(--text-color);
  border-radius: 16px;
  padding: 10px 17px;
  font: revert;
  font-size: calc(16 / 16 * 1rem);
  flex: 1;
  width: 100%;
  min-width: 0;

  &[type="checkbox"] {
    width: 20px;
    height: 20px;
    min-width: 20px;
    padding: 0;
    justify-self: start;
  }
`;

const InputArea = styled.textarea`
  background: var(--input-background);
  color: var(--text-color);
  border: 2px solid var(--input-border);
  border-radius: 16px;
  padding: 10px 17px;
  flex: 1;
  font-size: 1rem;
  width: 100%;
  min-width: 0;
`;

const X = styled.div`
  background-image: url(//d35aaqx5ub95lt.cloudfront.net/images/icon-sprite8.svg);
  background-position: -373px -154px;
  cursor: pointer;
  display: inline-block;
  height: 18px;
  vertical-align: middle;
  width: 18px;
`;

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
