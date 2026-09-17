# Robinhood Chain / pons migration

Decision: retain OpenFund and $OPEN. Use native ETH on Robinhood Chain (4663), the same network as pons. The replacement $OPEN contract address is unknown; show PLACEHOLDER and no trading/copy action until deployed. Do not reuse the Solana mint as an EVM address.

## Verified integration references (17 September 2026)

- [pons V1 documentation](https://docs.ponsfamily.com/): network, deployed contracts, TokenLaunched/Swap events, token metadata, creator payout reads. V1 uses Uniswap V3. The documented active factory starts at block 8991118.
- [pons V2 documentation](https://docs.ponsfamily.com/v2): separate factory and per-token curves, Uniswap V4 graduation, fee escrow and launch eligibility. Indexed official documentation says public launches are closed; query canLaunch(creator) before choosing this generation. The direct V2 page and launchpad returned a regional restriction through the research browser; V2 details were available through indexed official results and the official repository. Do not assume V1 ABIs apply to V2.
- [Official contract repository](https://github.com/ponsdotdev/ponsfamily): contractsV1 and contractsV2; root abi.json describes V1. Pin a source revision and verified deployed bytecode before integrating writes.
- [Robinhood network configuration](https://docs.robinhood.com/chain/connecting/): mainnet 4663; testnet 46630; ETH native currency; production provider options.
- [Robinhood contract deployment](https://docs.robinhood.com/chain/deploy-smart-contracts/): Foundry/Hardhat deployment and Blockscout verification.
- [ERC-681 payment requests](https://eips.ethereum.org/EIPS/eip-681): payment URLs can include chain ID and amount. Wallet support varies; always retain a network-labelled copy-address path.
- [Ethereum JSON-RPC](https://ethereum.org/developers/docs/apis/json-rpc/): read full block transactions, transaction receipts, canonical blocks and chain identity.

The documented public RPC responded with eth_chainId = 0x1237 (4663). Both documented V1/V2 factories returned non-empty eth_getCode. These read-only checks are repeatable with `npx tsx scripts/check-pons-network.ts`. They establish chain identity/code presence, not an audit or proof of ABI compatibility.

pons is the token launchpad, not a Next.js website hosting service. Website, database, background indexer, and RPC infrastructure still need their own deployment. Native campaign donations need no pons swap router. Token launch/trading and fundraising should be separate modules.

## Connectionless donation flow

1. A creator registers a dedicated EVM receiving address for a campaign. Authenticate campaign management with passkeys/email, or an optional one-time wallet signature. Prove address control or clearly label an unverified recipient; never imply arbitrary supplied addresses are verified.
2. The public campaign shows the full receiving address, ETH amount, QR/payment URI with `@4663`, and the label **ETH on Robinhood Chain (4663)**. Donors send from their wallet app without connecting it to OpenFund. They still authorize the transfer inside that wallet.
3. A persistent server worker scans new canonical blocks and matches successful native ETH transfers to registered campaign addresses. Verify chain, recipient, value, receipt status, campaign start block, and canonical block hash. Track pending/confirmed/reverted separately. Store wei as integer strings, never floating point. Deduplicate on chainId + transactionHash for simple transfers; trace path/log index is needed for trace/token records.
4. Increment totals transactionally/idempotently, reconcile periodically, rewind on reorganizations, and retain a durable cursor for restart/backfill. Polling or SSE updates the campaign log. An optional transaction-hash submission can accelerate lookup but is never trusted as payment proof or donor identity.
5. Contract-wallet/internal ETH sends need traces or a provider that explicitly supports internal transfers on Robinhood Chain. Ordinary ETH sends do not emit ERC-20 Transfer logs. Confirm provider coverage and finalized/safe block semantics before choosing confirmation policy. ERC-20 donations would need a separate allowlist and log decoder.

A dedicated address makes campaign attribution unambiguous. Reusing the same recipient for multiple campaigns cannot automatically distinguish them from plain transfers. Never use small decimal amount variations as a reliable campaign ID. A per-campaign forwarding contract is an alternative but introduces deployment, gas and contract security costs. Do not generate server-held private keys as a shortcut.

Copy-address payments cannot force the donor's wallet onto the right chain. Label every address, encode the chain in supported payment links, reject wrong-chain receipts, and never credit Ethereum-mainnet/testnet deposits. Do not promise automatic recovery of wrong-chain sends.

## Functionality and migration boundary

Keep public campaign pages, goals, totals, donation history, rankings, moderation and creator updates. Remove donor connect/sign/token-hold requirements for ordinary donations. Creator ownership, edits, private delivery links, authenticated comments, and admin actions still need authorization. A public transaction hash alone does not prove its submitter owns the donor wallet; do not unlock private rewards based solely on a hash.

The current app remains Solana-based underneath the visual refresh: WalletProvider, AuthProvider, useX403Auth, useFundraise, lib/x402, app/api/fundraise, app/api/agent-payment, and wallet-based schemas need migration. Existing price/raisedAmount values are USDC amounts: never relabel these as ETH. Add explicit chainId, asset, decimals, recipient, startBlock and amountWei fields to new campaign/payment records, preserve legacy records separately, then cut over after testnet verification. Retire Pump.fun buyback claims unless replaced by a separately implemented and verified mechanism; pons token trading fees are not automatically campaign donation fees.

Before enabling payments: verify creator address registration, duplicate webhook/worker handling, reorg reversal, worker restarts, failed receipts, wrong networks, multiple campaigns, partial amounts, very small/large wei values, and external-wallet/contract-wallet sends. Testnet is 46630 and must never be accepted by mainnet code.

No tokens were launched, contracts deployed, funds moved, or production payment flows switched during this work.
