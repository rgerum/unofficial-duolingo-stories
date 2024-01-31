import convertToComposeObject from "../../_parser/convert_parts";
import Part from "../../_components/exercise";

export default async function Page() {
  const input = `
[compose]
> Mi estas viro.
% mi, estas, viro; virino, knabo, knabino

> I am a man.
% i, am, a, man; woman, boy, girl
level: 1

[compose]
> Mi estas viro.
% mi, estas, viro; virino, knabo, knabino

> I am a man.
% i, am, a, man; woman, boy, girl
level: 2

[compose]
> Mi estas viro.
% mi, estas, viro; virino, knabo, knabino

> I am a man.
% i, am, a, man; woman, boy, girl
level: 3

[compose]
> Mi estas viro.
% mi, estas, viro; virino, knabo, knabino

> I am a man.
% i, am, a, man; woman, boy, girl
level: 4

[compose]
> Mi estas viro.
% mi, estas, viro; virino, knabo, knabino

> I am a man.
% i, am, a, man; woman, boy, girl
level: 5

[compose]
> Mi estas viro.
% mi, estas, viro; virino, knabo, knabino

> I am a man.
% i, am, a, man; woman, boy, girl
level: 6

[fill_choice]
> Ŝi estas [knabino].
- knabino
- knabo
- viro

[match]
- saluton <> hello
- bonan nokton <> good night
- bonan tagon <> good morning
- bonvolu <> please
- dankon <> thank you


[translate_choice]
> boy
+ knabo
- viro
- kaj

[conversation]
> Bonan tagon.
+ saluton
- bonvolu
- dankon

  `;
  const elements = convertToComposeObject(input);

  return (
    <>
      <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
        {elements.map((part, i) => (
          <Part key={i} data={part} active={10} />
        ))}
      </div>
    </>
  );
}
