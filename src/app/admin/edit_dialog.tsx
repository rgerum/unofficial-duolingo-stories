import styled, { keyframes } from "styled-components";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";

export function Content({ children }) {
  return (
    <Dialog.Portal>
      <DialogOverlay />
      <DialogContent>
        {children}
        <Dialog.Close asChild>
          <IconButton aria-label="Close">
            <X />
          </IconButton>
        </Dialog.Close>
      </DialogContent>
    </Dialog.Portal>
  );
}

export const Root = Dialog.Root;
export const Trigger = Dialog.Trigger;

export function EditDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button>Edit profile</Button>
      </Dialog.Trigger>
      <Content>
        <DialogTitle>Edit profile</DialogTitle>
        <DialogDescription>
          {`Make changes to your profile here. Click save when you're done.`}
        </DialogDescription>
        <Fieldset>
          <Label className="Label" htmlFor="name">
            Name
          </Label>
          <Input className="Input" id="name" defaultValue="Pedro Duarte" />
        </Fieldset>
        <Fieldset>
          <Label className="Label" htmlFor="username">
            Username
          </Label>
          <Input className="Input" id="username" defaultValue="@peduarte" />
        </Fieldset>
        <div
          style={{
            display: "flex",
            marginTop: 25,
            justifyContent: "flex-end",
          }}
        >
          <Dialog.Close asChild>
            <Button className="Button green">Save changes</Button>
          </Dialog.Close>
        </div>
      </Content>
    </Dialog.Root>
  );
}

const overlayShow = keyframes`
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
`;

const contentShow = keyframes`
    from {
        opacity: 0;
        transform: translate(-50%, -48%) scale(0.96);
    }
    to {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }
`;

const DialogOverlay = styled(Dialog.Overlay)`
  background-color: hsl(0deg 0% 0% / 0.8);
  position: fixed;
  inset: 0;
  animation: ${overlayShow} 150ms cubic-bezier(0.16, 1, 0.3, 1);
`;

const DialogContent = styled(Dialog.Content)`
  background-color: var(--body-background);
  border-radius: 6px;
  box-shadow:
    hsl(206 22% 7% / 35%) 0px 10px 38px -10px,
    hsl(206 22% 7% / 20%) 0px 10px 20px -15px;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90vw;
  max-width: 450px;
  max-height: 85vh;
  padding: 25px;
  animation: ${contentShow} 150ms cubic-bezier(0.16, 1, 0.3, 1);

  &:focus {
    outline: none;
  }
`;

export const DialogTitle = styled(Dialog.Title)`
  margin-left: 0;
  font-weight: 500;
  font-size: calc(21 / 16 * 1rem);

  margin-top: -16px;
  margin-bottom: 16px;
`;

export const DialogDescription = styled(Dialog.Description)`
  margin: 10px 0 20px;
  font-size: calc(16 / 16 * 1rem);
  line-height: 1.5;
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
  /* border radius for the focus */
  border-radius: 100vw;
`;
export const Fieldset = styled.fieldset`
  display: flex;
  gap: 20px;
  align-items: baseline;
  border: 0;
  width: 100%;
`;

export const Label = styled.label`
  font-size: calc(16 / 16 * 1rem);
  width: 90px;
  text-align: right;

  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
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
`;

export const InputArea = styled.textarea`
  background: var(--input-background);
  color: var(--text-color);
  border: 2px solid var(--input-border);
  border-radius: 16px;
  padding: 10px 17px;
  flex: 1;
  font-size: 1rem;
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

export function InputText({ name, label, value, setValue }) {
  return (
    <Fieldset>
      <Label className="Label" htmlFor={label}>
        {name}
      </Label>
      <Input
        className="Input"
        id={label}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </Fieldset>
  );
}

export function InputTextArea({ name, label, value, setValue }) {
  return (
    <Fieldset>
      <Label className="Label" htmlFor={label}>
        {name}
      </Label>
      <InputArea
        id={label}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </Fieldset>
  );
}

export function InputBool({ name, label, value, setValue }) {
  return (
    <Fieldset>
      <Label className="Label" htmlFor={label}>
        {name}
      </Label>
      <Input
        className="Input"
        type={"checkbox"}
        id={label}
        defaultChecked={value}
        onChange={(e) => setValue(e.target.checked)}
      />
    </Fieldset>
  );
}
