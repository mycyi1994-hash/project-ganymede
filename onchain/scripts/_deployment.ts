import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface Deployment {
  chainId: number;
  network: string;
  explorer: string;
  deployedAt: string;
  admin: string;
  relayer: string;
  contracts: {
    GanymedeFundShare: {
      address: string;
      productId: string;
      name: string;
      symbol: string;
      constructorArgs: unknown[];
    };
    GanymedeNavRegistry: { address: string; constructorArgs: unknown[] };
  };
}

export function loadDeployment(): Deployment {
  const path = join(__dirname, "..", "deployments", "giwa-sepolia.json");
  try {
    return JSON.parse(readFileSync(path, "utf8")) as Deployment;
  } catch {
    throw new Error(`No deployment record at ${path}. Run \`npm run deploy\` first.`);
  }
}
