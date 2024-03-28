import fs from 'node:fs';
import path from 'path';
import chalk from 'chalk';
import { exec } from 'child_process';

console.log(chalk.blue('new-component 1.0\n'));
if (process.argv.length < 3) {
  console.log(chalk.red('Add a name for the component'));
  process.exit(0);
}
const component_name = process.argv[2];
if (
  component_name.substring(0, 1) ===
  component_name.substring(0, 1).toLowerCase()
) {
  console.log(chalk.red(
    `Component name needs to start with capital letter: ${component_name}`,
  ));
  process.exit(0);
}
console.log(chalk.blue(`Create Component '${component_name}'`));

const base_folder = "./src/components/";
const comp_folder = path.join(base_folder, component_name);

function createFile(folder, name, content) {
  // Check if the directory exists
  if (!fs.existsSync(folder))
    // If the directory does not exist, create it
    fs.mkdirSync(folder, { recursive: true });

  console.log(path.join(folder, name));
  exec('git add '+path.join(folder, name));
  fs.writeFileSync(path.join(folder, name), content);
}

createFile(
  comp_folder,
  "index.js",
  `export * from "./${component_name}";
export { default } from "./${component_name}";
`,
);

createFile(
  comp_folder,
  component_name + ".jsx",
  `import React from 'react';
import styles from './${component_name}.module.css';

function ${component_name}() {
  return <div></div>;
}

export default ${component_name};
`,
);
createFile(comp_folder, component_name + ".module.css", ``);

console.log(chalk.green(`\nSuccessfully created '${component_name}'!`));