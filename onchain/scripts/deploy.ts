/**
 * Deploys the Ganymede settlement contracts to GIWA Sepolia and hands the
 * hot-key roles to the relayer.
 *
 * Role wiring performed here:
 *
 *   GanymedeFundShare    administrator = ADMIN   (constructor)
 *                        transferAgent = ADMIN   (constructor, left as-is)
 *                        issuer        = RELAYER (setIssuer, this script)
 *
 *   GanymedeNavRegistry  administrator = ADMIN   (constructor)
 *                        publisher     = RELAYER (constructor)
 *
 * transferAgent stays on the cold key on purpose: allowlisting an investor is a
 * compliance decision, not something an internet-facing relayer should be able
 * to do. The relayer can mint, burn and publish. Nothing else.
 *
 * Run: npm run deploy
 */
import hre from "hardhat";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const FUND_NAME = process.env.FUND_SHARE_NAME ?? "Ganymede Core 20";
const FUND_SYMBOL = process.env.FUND_SHARE_SYMBOL ?? "GMDCORE";

// Which engine product this share ledger represents. Must match a product id in
// lib/engine/seed.ts — the relayer maps productId -> share contract with it.
const FUND_PRODUCT_ID = process.env.FUND_SHARE_PRODUCT_ID ?? "core-20";

async function main() {
  const clients = await hre.viem.getWalletClients();
  if (clients.length < 2) {
    throw new Error(
      "Two accounts required. Set ADMIN_PRIVATE_KEY and RELAYER_PRIVATE_KEY in onchain/.env — " +
        `got ${clients.length}.`,
    );
  }
  const [admin, relayer] = clients;
  const publicClient = await hre.viem.getPublicClient();

  const adminAddress = admin.account.address;
  const relayerAddress = relayer.account.address;
  if (adminAddress.toLowerCase() === relayerAddress.toLowerCase()) {
    throw new Error("ADMIN and RELAYER must be different keys — role separation is the security model.");
  }

  const adminBalance = await publicClient.getBalance({ address: adminAddress });
  if (adminBalance === 0n) {
    throw new Error(`Admin ${adminAddress} has no GIWA Sepolia ETH. Fund it from the faucet first.`);
  }

  console.log(`network      chainId ${await publicClient.getChainId()}`);
  console.log(`admin        ${adminAddress}`);
  console.log(`relayer      ${relayerAddress}\n`);

  console.log("deploying GanymedeFundShare...");
  const fundShare = await hre.viem.deployContract(
    "GanymedeFundShare",
    [FUND_NAME, FUND_SYMBOL, adminAddress],
    { client: { wallet: admin } },
  );
  console.log(`  ${fundShare.address}`);

  console.log("deploying GanymedeNavRegistry...");
  const navRegistry = await hre.viem.deployContract(
    "GanymedeNavRegistry",
    [adminAddress, relayerAddress],
    { client: { wallet: admin } },
  );
  console.log(`  ${navRegistry.address}`);

  console.log("\nhanding issuance to the relayer key...");
  const setIssuerTx = await fundShare.write.setIssuer([relayerAddress], { account: admin.account });
  await publicClient.waitForTransactionReceipt({ hash: setIssuerTx });
  console.log(`  setIssuer  ${setIssuerTx}`);

  // Verify the wiring landed rather than trusting the receipts.
  const [onChainIssuer, onChainAdmin, onChainAgent, onChainPublisher] = await Promise.all([
    fundShare.read.issuer(),
    fundShare.read.administrator(),
    fundShare.read.transferAgent(),
    navRegistry.read.publisher(),
  ]);

  const checks: Array<[string, string, string]> = [
    ["fundShare.issuer", onChainIssuer, relayerAddress],
    ["fundShare.administrator", onChainAdmin, adminAddress],
    ["fundShare.transferAgent", onChainAgent, adminAddress],
    ["navRegistry.publisher", onChainPublisher, relayerAddress],
  ];
  for (const [label, actual, expected] of checks) {
    if (actual.toLowerCase() !== expected.toLowerCase()) {
      throw new Error(`role wiring failed: ${label} is ${actual}, expected ${expected}`);
    }
    console.log(`  ok  ${label} = ${actual}`);
  }

  const record = {
    chainId: 91342,
    network: "giwa-sepolia",
    explorer: "https://sepolia-explorer.giwa.io",
    deployedAt: new Date().toISOString(),
    admin: adminAddress,
    relayer: relayerAddress,
    contracts: {
      GanymedeFundShare: {
        address: fundShare.address,
        productId: FUND_PRODUCT_ID,
        name: FUND_NAME,
        symbol: FUND_SYMBOL,
        constructorArgs: [FUND_NAME, FUND_SYMBOL, adminAddress],
      },
      GanymedeNavRegistry: {
        address: navRegistry.address,
        constructorArgs: [adminAddress, relayerAddress],
      },
    },
  };

  const outDir = join(__dirname, "..", "deployments");
  mkdirSync(outDir, { recursive: true });
  const outFile = join(outDir, "giwa-sepolia.json");
  writeFileSync(outFile, `${JSON.stringify(record, null, 2)}\n`);

  console.log(`\nwrote ${outFile}\n`);
  console.log("── next: verify the sources on the explorer ──────────────────");
  console.log(
    `npx hardhat verify --network giwaSepolia ${fundShare.address} ` +
      `"${FUND_NAME}" "${FUND_SYMBOL}" ${adminAddress}`,
  );
  console.log(
    `npx hardhat verify --network giwaSepolia ${navRegistry.address} ` +
      `${adminAddress} ${relayerAddress}`,
  );
  console.log("\n── then: put these in the app's .env ─────────────────────────");
  console.log(`GIWA_FUND_SHARE_ADDRESS=${fundShare.address}`);
  console.log(`GIWA_NAV_REGISTRY_ADDRESS=${navRegistry.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
