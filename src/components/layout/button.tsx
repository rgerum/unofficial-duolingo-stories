import styled from "styled-components";

export default function Button({
  children,
  primary = false,
  ...delegated
}: {
  children: React.ReactNode;
  primary?: boolean;
  [key: string]: any;
}) {
  const ButtonComponent = primary ? ButtonBlueStyled : ButtonStyled;

  return (
    <ButtonComponent {...delegated}>
      <Wrapper>{children}</Wrapper>
    </ButtonComponent>
  );
}

const ButtonStyled = styled.button`
  border: 0;
  padding: 0;
  margin-top: 4px;
  border-radius: 15px;
  transition:
    0.1s box-shadow,
    0.1s transform;
  color: var(--button-color);

  background-color: var(--button-border);
  --foreground-color: var(--button-background);
`;

const Wrapper = styled.span`
  display: block;

  padding: 10px 30px;
  border-radius: inherit;

  text-transform: uppercase;
  font-weight: 700;
  font-size: 1rem;

  background: var(--foreground-color);

  transform: translateY(-4px);
  transition: transform 500ms ease-out;

  ${ButtonStyled}:hover & {
    filter: brightness(1.1);
    transform: translateY(-5px);
    transition: transform 100ms;
  }
  ${ButtonStyled}:active & {
    transform: translateY(-2px);
    transition: transform 50ms ease-out;
  }
`;

const ButtonBlueStyled = styled(ButtonStyled)`
  --foreground-color: var(--button-blue-background);
  color: var(--button-blue-color);
  background-color: var(--button-blue-border);
`;
