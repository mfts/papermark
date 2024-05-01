export async function getHeadings(source: string) {
  // Get each line individually, and filter out anything that
  // isn't a heading.
  const headingLines = source.split("\n").filter((line) => {
    return line.match(/^##\s/);
  });

  // Transform the string '## Some text' into an object
  // with the shape '{ text: 'Some text', level: 2 }'
  return headingLines.map((raw) => {
    const text = raw.replace(/^##\s/, "");
    // I only care about h2.
    // If I wanted more levels, I'd need to count the
    // number of #s.
    // match only h2
    // const level = raw.slice(0, 2) === "##" ? 2 : 1;

    return { text, level: 2 };
  });
}
