const { spawn } = require("child_process");

async function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args);

    child.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    child.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}

// Usage
(async () => {
  try {
    // Replace 'ls' and ['.', '-lh'] with your command and its arguments
    await runCommand("npm", ["run", "init"]);
    await runCommand("npm", ["run", "build"]);
    console.log("Command executed successfully");
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
})();
