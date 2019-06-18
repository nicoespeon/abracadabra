import { createUpdateCodeContractTests } from "../i-update-code-contract-test";

import { createWriteInMemoryOn } from "./update-code-in-memory";

createUpdateCodeContractTests("InMemory", createWriteInMemoryOn);
