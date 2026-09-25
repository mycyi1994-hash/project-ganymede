# In-kind creation and redemption with the real xStocks

The testnet USTX fund holds no assets: it burns the demo dollars an investment brings and mints new
ones for a redemption. A mainnet fund has to hold the xStocks. `contracts/GanymedeBasketVault.sol`
is that path, built the way ETF creation and redemption work: one share is a fixed quantity of each
constituent, creating shares delivers exactly those quantities to the vault, and redeeming returns
them. The vault prices nothing and has no owner, and after every creation and redemption it checks
that it holds the constituents of every share outstanding.

It is not deployed. `npm run fork:vault` (in `onchain/`) runs it against the real xStocks on a fork
of X Layer mainnet, in memory, with local test accounts and no key:

1. AAPLx, MSFTx and NVDAx are bought on their Uniswap V3 pools with USDG, and each pool's ERC-4626
   wrapper is redeemed for the xStock itself (`contracts/testing/ForkPoolBuyer.sol`). On the fork the
   USDG comes from the METAx pool, outside the basket.
2. The vault is deployed with MAG3's units per share (`public/baskets/mag3/basket.json`), the same
   units the MAG3 documents on X Layer Testnet value.
3. 10 shares are created by delivering those units.
4. 4 shares move to a second account, which redeems them for the xStocks.
5. The other 6 are redeemed, leaving only rounding allowances in the vault.

## What the fork showed

xStocks keep balances as shares times a multiplier, so a transfer can arrive a base unit short:
sending 10^18 AAPLx (one token) delivered 10^18 − 1. A vault that insists on receiving exactly the
amount sent rejects every xStock, and one that trusts the amount sent can end up a base unit
under-backed. `GanymedeBasketVault` asks for the units rounded up plus `ROUNDING_ALLOWANCE` (4 base
units, 4 × 10^-18 of a token) on creation, pays the units rounded down less the same on redemption,
and reverts unless every balance still covers `unitsPerShare × totalSupply`. A fee-on-transfer token
fails that check (`test/GanymedeBasketVault.test.ts`); an xStock passes it.

## The run on 25 September 2026

```text
forked X Layer mainnet at block 71590315 (2026-09-25T18:02:31.000Z), in memory only

1. bought on the X Layer pools and unwrapped
   AAPLx  1.176697 for $400 USDG in pool 0xc44bd9c8589026d28d1632d7b86b2efb6cdc8fd2
   MSFTx  0.772119 for $400 USDG in pool 0x66187278490a70a8ac26a6e159eb045f82dbfb57
   NVDAx  1.779475 for $400 USDG in pool 0x2a2b11730c2b6d99a58034a869dd810d7300a7b2

2. vault deployed on the fork at 0x84ea74d481ee0a5332c457a4d796187f6ba67feb with MAG3's units per share

3. created 10 shares by delivering units × shares, rounded up, plus 4 base units:
     AAPLx  0.981335 (981334569096697123 base units)
     MSFTx  0.645733 (645732529530595283 base units)
     NVDAx  1.483168 (1483168328965507173 base units)
   after creation: 10 shares outstanding, fully backed: true
     AAPLx  held 0.981335, units × supply 0.981335
     MSFTx  held 0.645733, units × supply 0.645733
     NVDAx  held 1.483168, units × supply 1.483168

4. a second account received 4 shares and redeemed them for:
     AAPLx  0.392534 (392533827638678843 base units; the vault sent 392533827638678844)
     MSFTx  0.258293 (258293011812238107 base units; the vault sent 258293011812238108)
     NVDAx  0.593267 (593267331586202863 base units; the vault sent 593267331586202864)
   after that redemption: 6 shares outstanding, fully backed: true
     AAPLx  held 0.588801, units × supply 0.588801
     MSFTx  held 0.387440, units × supply 0.387440
     NVDAx  held 0.889901, units × supply 0.889901

5. the creator redeemed the other 6 shares
   at the end: 0 shares outstanding, fully backed: true
     AAPLx  held 0.000000, units × supply 0.000000
     MSFTx  held 0.000000, units × supply 0.000000
     NVDAx  held 0.000000, units × supply 0.000000
     AAPLx  13 base units of rounding allowance stay in the vault
     MSFTx  13 base units of rounding allowance stay in the vault
     NVDAx  13 base units of rounding allowance stay in the vault

every step matched: the vault took exactly the xStocks each share stands for and returned them on redemption.
```

## What this does not cover

The fork proves the token mechanics with the real xStock contracts and pools, not an operation:
nothing was bought or held on mainnet, no custody, licensing or issuer agreement exists, and the
vault has not been audited. Creation in kind needs a participant that already holds the xStocks; a
cash path that buys them through OKX DEX, and rebalancing, are not built.
