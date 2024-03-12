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
          Make changes to your profile here. Click save when you're done.
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
  background-color: white;
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
  margin: 0;
  font-weight: 500;
  font-size: calc(18 / 16 * 1rem);
`;

export const DialogDescription = styled(Dialog.Description)`
  margin: 10px 0 20px;
  font-size: calc(16 / 16 * 1rem);
  line-height: 1.5;
`;

export const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  padding: 0 15px;
  font-size: calc(16 / 16 * 1rem);
  line-height: 1;
  font-weight: 500;
  height: 35px;
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
  width: 100%;
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  padding: 0 10px;
  font-size: calc(16 / 16 * 1rem);
  line-height: 1;
  height: 35px;
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
