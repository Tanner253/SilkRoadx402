/** Confirmed against pons and Robinhood documentation, plus eth_chainId on 2026-09-17.
 * Native ETH here is on Robinhood Chain, NOT Ethereum mainnet (chain 1).
 * This config does not activate or relabel the legacy Solana payment paths.
 */
export const ROBINHOOD_CHAIN = {
  id: 4663,
  hexId: '0x1237',
  name: 'Robinhood Chain',
  paymentLabel: 'ETH on Robinhood Chain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrl: 'https://rpc.mainnet.chain.robinhood.com',
  explorerUrl: 'https://robinhoodchain.blockscout.com',
  docsUrl: 'https://docs.robinhood.com/chain/connecting/',
} as const;

// Different protocol versions, not interchangeable. Pin the generation at launch.
export const PONS_FACTORIES = {
  v1: '0xA5aAb3F0c6EeadF30Ef1D3Eb997108E976351feB',
  v2: '0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e',
} as const;

export function assertRobinhoodChain(chainId: string | number): void {
  const actual = typeof chainId === 'string' && /^0x[0-9a-f]+$/i.test(chainId) ? Number.parseInt(chainId.slice(2), 16) : chainId;
  if (actual !== ROBINHOOD_CHAIN.id) throw new Error('Wrong network: OpenFund requires Robinhood Chain (4663).');
}
