import { ROBINHOOD_CHAIN, PONS_FACTORIES, assertRobinhoodChain } from '../config/robinhood';

async function main() {
  // Read only. No signer, private key, approval, or transaction submission.
  const rpc = process.env.ROBINHOOD_RPC_URL || ROBINHOOD_CHAIN.rpcUrl;
  async function request(method: string, params: unknown[] = []) {
    const response = await fetch(rpc, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}), signal:AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`RPC returned HTTP ${response.status}`);
    const result = await response.json();
    if (result.error || result.result === undefined) throw new Error('RPC request failed');
    return result.result;
  }
  const chain = await request('eth_chainId');
  assertRobinhoodChain(chain);
  console.log(`Verified ${ROBINHOOD_CHAIN.name}: ${chain} (${ROBINHOOD_CHAIN.id})`);
  for (const [version,address] of Object.entries(PONS_FACTORIES)) {
    const code = await request('eth_getCode',[address,'latest']);
    if (typeof code !== 'string' || code === '0x') throw new Error(`No deployed code at documented ${version} factory`);
    console.log(`pons ${version}: deployed code present at ${address}`);
  }
  console.log('This checks chain identity and code presence, not ABI compatibility, launch eligibility, or bytecode equivalence.');
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Preflight failed'); process.exitCode = 1; });
