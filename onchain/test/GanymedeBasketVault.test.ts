import { expect } from "chai";
import hre from "hardhat";
import { maxUint256, zeroAddress } from "viem";

const SHARE = 1_000_000n;
const ALLOWANCE = 4n;
// Three constituents with awkward units per share, so rounding shows up.
const UNITS = [1_234_567n, 7_654_321n, 3n];

async function deploy() {
  const [admin, creator, other] = await hre.viem.getWalletClients();
  // Deployed one at a time, so the deployer's nonces never race.
  const deployDollar = () => hre.viem.deployContract("GanymedeDemoDollar", [admin.account.address]);
  const tokens: Awaited<ReturnType<typeof deployDollar>>[] = [];
  for (let index = 0; index < UNITS.length; index++) tokens.push(await deployDollar());
  for (const token of tokens) {
    for (const wallet of [creator, other]) await token.write.claim({ account: wallet.account });
  }
  const vault = await hre.viem.deployContract("GanymedeBasketVault", ["Test basket in kind", "TBK", tokens.map((token) => token.address), UNITS]);
  for (const token of tokens) {
    await token.write.approve([vault.address, maxUint256], { account: creator.account });
    await token.write.approve([vault.address, maxUint256], { account: other.account });
  }
  const held = () => Promise.all(tokens.map((token) => token.read.balanceOf([vault.address])));
  return { admin, creator, other, tokens, vault, held };
}

describe("GanymedeBasketVault", () => {
  it("refuses an empty, mismatched, zero, repeated or non-contract basket", async () => {
    const { tokens, creator } = await deploy();
    const [a, b] = tokens.map((token) => token.address);
    for (const [addresses, units] of [
      [[], []],
      [[a, b], [1n]],
      [[a, b], [1n, 0n]],
      [[a, a], [1n, 1n]],
      [[a, creator.account.address], [1n, 1n]],
      [[a, zeroAddress], [1n, 1n]],
    ] as const) {
      await expect(hre.viem.deployContract("GanymedeBasketVault", ["x", "x", [...addresses], [...units]])).to.be.rejectedWith("InvalidBasket");
    }
  });

  it("creates shares only for the exact units, rounded up, and stays fully backed", async () => {
    const { vault, creator, tokens, held } = await deploy();
    const shares = 2_500_001n; // 2.500001 shares
    const [createIn] = await vault.read.amountsFor([shares]);
    UNITS.forEach((units, index) => {
      const product = units * shares;
      expect(createIn[index]).to.equal(product / SHARE + (product % SHARE === 0n ? 0n : 1n) + ALLOWANCE);
    });
    const before = await Promise.all(tokens.map((token) => token.read.balanceOf([creator.account.address])));
    await vault.write.create([shares], { account: creator.account });
    const after = await Promise.all(tokens.map((token) => token.read.balanceOf([creator.account.address])));
    tokens.forEach((_, index) => expect(before[index] - after[index]).to.equal(createIn[index]));
    expect(await held()).to.deep.equal(createIn);
    expect(await vault.read.balanceOf([creator.account.address])).to.equal(shares);
    expect(await vault.read.totalSupply()).to.equal(shares);
    expect(await vault.read.isFullyBacked()).to.equal(true);
  });

  it("redeems shares for their units, rounded down, from any holder", async () => {
    const { vault, creator, other, tokens, held } = await deploy();
    await vault.write.create([10n * SHARE], { account: creator.account });
    await vault.write.transfer([other.account.address, 3n * SHARE + 7n], { account: creator.account });
    const [, redeemOut] = await vault.read.amountsFor([3n * SHARE + 7n]);
    const before = await Promise.all(tokens.map((token) => token.read.balanceOf([other.account.address])));
    await vault.write.redeem([3n * SHARE + 7n], { account: other.account });
    const after = await Promise.all(tokens.map((token) => token.read.balanceOf([other.account.address])));
    tokens.forEach((_, index) => expect(after[index] - before[index]).to.equal(redeemOut[index]));
    expect(await vault.read.isFullyBacked()).to.equal(true);
    await vault.write.redeem([await vault.read.balanceOf([creator.account.address])], { account: creator.account });
    expect(await vault.read.totalSupply()).to.equal(0n);
    // Only the rounding allowances remain: at most a few base units of each token.
    for (const amount of await held()) expect(amount <= 3n * ALLOWANCE + 2n).to.equal(true);
  });

  it("rejects zero amounts, overdrafts, missing approvals and burns to the vault", async () => {
    const { vault, creator, other, tokens } = await deploy();
    await expect(vault.write.create([0n], { account: creator.account })).to.be.rejectedWith("InvalidAmount");
    await vault.write.create([SHARE], { account: creator.account });
    await expect(vault.write.redeem([SHARE + 1n], { account: creator.account })).to.be.rejectedWith("InsufficientBalance");
    await expect(vault.write.redeem([0n], { account: creator.account })).to.be.rejectedWith("InvalidAmount");
    await expect(vault.write.transfer([vault.address, 1n], { account: creator.account })).to.be.rejectedWith("InvalidAmount");
    await expect(vault.write.transferFrom([creator.account.address, other.account.address, 1n], { account: other.account })).to.be.rejectedWith("InsufficientAllowance");
    await tokens[1].write.approve([vault.address, 0n], { account: other.account });
    await expect(vault.write.create([SHARE], { account: other.account })).to.be.rejectedWith("TransferFailed");
  });

  it("refuses a token that delivers less than it was sent", async () => {
    const { creator, tokens } = await deploy();
    const taxed = await hre.viem.deployContract("FeeOnTransferToken", [creator.account.address, 10n ** 24n]);
    const vault = await hre.viem.deployContract("GanymedeBasketVault", ["Taxed", "TAX", [tokens[0].address, taxed.address], [SHARE, 10n ** 18n]]);
    await tokens[0].write.approve([vault.address, maxUint256], { account: creator.account });
    await taxed.write.approve([vault.address, maxUint256], { account: creator.account });
    await expect(vault.write.create([SHARE], { account: creator.account })).to.be.rejectedWith("NotFullyBacked");
  });
});
