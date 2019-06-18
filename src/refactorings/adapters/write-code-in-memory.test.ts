import { createWriteCodeContractTests } from "../i-write-code-contract-test";

import { createWriteInMemory } from "./write-code-in-memory";

createWriteCodeContractTests("InMemory", createWriteInMemory);
