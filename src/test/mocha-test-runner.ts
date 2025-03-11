import { glob } from "glob";
import Mocha from "mocha";
import * as path from "path";

export async function run(): Promise<void> {
  const mocha = new Mocha({
    ui: "tdd",
    color: true,
    timeout: "10s"
  });

  // The folder containing the source code where tests are located
  const testsRoot = path.resolve(__dirname, "..");

  const files = await glob("**/**.contract.test.js", { cwd: testsRoot });

  files.forEach((file) => mocha.addFile(path.resolve(testsRoot, file)));

  const runner = mocha.run((failures) => {
    if (failures > 0) {
      throw new Error(`${failures} tests failed.`);
    }
  });

  // Keep process alive until it's over
  return new Promise((resolve) => {
    runner.on("end", resolve);
  });
}
