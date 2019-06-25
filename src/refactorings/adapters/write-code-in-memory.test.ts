import { createWriteCodeContractTests } from "../editor/i-write-code-contract-test";

import { createWriteInMemory } from "./write-code-in-memory";

createWriteCodeContractTests("InMemory", createWriteInMemory);
