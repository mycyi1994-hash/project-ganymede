import "@nomicfoundation/hardhat-toolbox-viem";
import "dotenv/config";
import type { HardhatUserConfig } from "hardhat/config";

/**
 * Two independent keys, by design (see contracts/README.md):
 *
 *   ADMIN_PRIVATE_KEY    cold  — administrator on both contracts, transfer agent
 *                               on the share ledger. Role changes, pause, allowlist.
 *   RELAYER_PRIVATE_KEY  hot   — issuer on the share ledger, publisher on the NAV
 *                               registry. Mint/burn/publish only.
 *
 * A leaked relayer key can mint and publish. It cannot pause, re-assign roles or
 * allowlist an investor. That separation is the whole point — never merge them.
 */
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY ?? "";
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY ?? "";

const accounts = [ADMIN_PRIVATE_KEY, RELAYER_PRIVATE_KEY].filter(
  (key): key is string => /^0x[0-9a-fA-F]{64}$/.test(key),
);

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      // Verification needs the exact metadata the deployed bytecode carries.
      metadata: { bytecodeHash: "ipfs" },
    },
  },
  // The project root is the repository root so the contracts stay where
  // contracts/README.md already points to them. Build output stays in onchain/.
  paths: {
    root: "..",
    sources: "contracts",
    tests: "onchain/test",
    cache: "onchain/cache",
    artifacts: "onchain/artifacts",
  },
  networks: {
    giwaSepolia: {
      url: process.env.GIWA_RPC_URL ?? "https://sepolia-rpc.giwa.io",
      chainId: 91342,
      accounts,
    },
  },
  etherscan: {
    // GIWA's explorer is Blockscout; it ignores the key but hardhat-verify
    // requires the field to be present.
    apiKey: { giwaSepolia: process.env.EXPLORER_API_KEY ?? "blockscout" },
    customChains: [
      {
        network: "giwaSepolia",
        chainId: 91342,
        urls: {
          apiURL: "https://sepolia-explorer.giwa.io/api",
          browserURL: "https://sepolia-explorer.giwa.io",
        },
      },
    ],
  },
  sourcify: { enabled: false },
};

export default config;
