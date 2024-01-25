import WordButton from "./word_button";

export default function WordBank({ words }) {
  return (
    <div>
      {words.map((a, i) => (
        <WordButton key={i} {...a} />
      ))}
    </div>
  );
}
