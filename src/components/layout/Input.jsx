import styled from "styled-components";

export default function Input({ label = null, ...delegated }) {
  if (label) {
    return (
      <Label>
        <span>{label}</span>
        <InputField {...delegated} />
      </Label>
    );
  }
  return <InputField {...delegated} />;
}

const Label = styled.label`
  display: inline-flex;
  flex-direction: row;
  gap: 8px;
  align-items: baseline;
`;

const InputField = styled.input`
  background: var(--input-background);
  border: 2px solid var(--input-border);
  color: var(--text-color);
  border-radius: 16px;
  padding: 10px 17px;
  font: revert;
  font-size: calc(16 / 16 * 1rem);
  flex: 1;
`;
