import {
  createWriteCodeContractTests,
  createReadThenWriteCodeContractTests
} from "../i-write-code-contract-test";

import {
  createWriteInMemory,
  createReadThenWriteInMemory
} from "./write-code-in-memory";

createWriteCodeContractTests("InMemory", createWriteInMemory);
createReadThenWriteCodeContractTests("InMemory", createReadThenWriteInMemory);
