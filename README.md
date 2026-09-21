# OpenFund

No-KYC crowdfunding on **Robinhood Chain**. Anyone can start a fundraiser; anyone can give ETH
from the wallet they already use. There are no accounts and no wallet connections — OpenFund is
a bridge between people who need help and people who want to give, and never holds the money:
every donation goes straight from the donor's wallet to the creator's.

The app lives in [`silkroad/`](silkroad) (the folder name predates the rename).

## How it works

**Creating a campaign.** A creator writes a title and story, sets a goal in ETH, adds a cover
image and any number of links (YouTube videos play inline), and gives the wallet address
donations should go to. It goes live immediately — there is no review queue. They receive a
private **manage link** (`/fundraisers/<id>#manage=<token>`) that is their only credential for
editing, pausing or deleting the campaign. The token lives in the URL fragment, so it's never
sent to a server or leaked via `Referer`; only its SHA-256 hash is stored. The payout address
can't be changed after creation, so a leaked manage link can't redirect donations.

**Donating.** The donor enters the wallet address they'll give from; only then is the campaign
address shown. They send ETH from that wallet, and the site detects the transfer on-chain and
counts it — usually within seconds. A banner follows them around the site until it's confirmed.
A donation is only counted if it comes from the registered wallet: transfers from an exchange or
through a smart-contract wallet originate from a different address and can't be matched.

### Detecting a transfer from an address (`lib/chain/watch.ts`)

Plain ETH transfers emit no logs, Robinhood Chain produces ~10 blocks/second, and its explorer
blocks server-side requests — so scanning blocks is out. Instead:

1. On registration we record the current block and the donor's **nonce** (it increments by
   exactly one per transaction they send).
2. Each check asks only "what's their nonce now?" — **2 RPC calls**. Unchanged → nothing was
   sent; the cursor jumps to the head.
3. When it has increased, each new transaction is located by **binary-searching** for the block
   where the nonce ticked over (~13–20 calls), and that single block is read. Transfers to the
   campaign address are then fully verified (`lib/chain/robinhood.ts`): chain 4663, sender,
   recipient, success, value ≥ 0.00001 ETH, mined after the campaign was created.
4. Each transaction hash is credited at most once (unique index), so retries and races are
   harmless.

The public RPC keeps ~10 minutes of state. Idle watches never need history (their cursor advances
on every check), so this only matters when a watch goes unchecked for 10+ minutes *and* the donor
sent something meanwhile. Then `ROBINHOOD_ARCHIVE_RPC_URL` is used if configured; otherwise the
watch waits in `needs_archive`.

**RPC cost controls:** each watch is checked at most once every 6 s server-side (atomic claim in
MongoDB, regardless of how many tabs poll); clients poll only while a tab is visible and back off
from 8 s → 30 s → 2 min; at most 3 watches are checked per request and 5 transactions resolved
per watch per check; watches expire after 48 h.

## Moderation

`/admin` (log in with `ADMIN_CODE`) lists campaigns with report counts and can remove, restore
and pin them. Removing sets `approved: false`, which a creator can't undo with their manage
link. Sessions are HMAC-signed, expiring, httpOnly cookies; login is rate-limited (fails closed)
and disabled in production unless `ADMIN_CODE` and `JWT_SECRET` are properly set.

## Development

```bash
cd silkroad
npm install
cp .env.example .env.local   # fill in MONGODB_URI, Cloudinary, ADMIN_CODE, JWT_SECRET, APP_SECRET
npm run dev
```

- `npx tsc --noEmit` — typecheck
- `npm run lint` — lint
- `npm run build` — production build
- `npx tsx scripts/generate-brand-media.tsx` — regenerate the social banner/avatar and the site
  icons from the `PiggyBank` mascot component

## Network facts

| | |
| :-- | :-- |
| Chain | Robinhood Chain, id **4663** (`0x1237`) — *not* Ethereum mainnet |
| Currency | ETH, 18 decimals |
| Public RPC | `https://rpc.mainnet.chain.robinhood.com` |
| Explorer | `https://robinhoodchain.blockscout.com` |
| Docs | [Robinhood Chain](https://docs.robinhood.com/chain/connecting/) · [pons](https://docs.ponsfamily.com/) |

The `$OPENFUND` token is live on [pons](https://www.ponsfamily.com/launchpad) at
`0xFB4eD31b0c895eee1C4778680d972c5695056902` (Robinhood Chain), set in `silkroad/config/platform.ts`.

## Legacy data

Campaigns from the Solana era (USDC) are still displayed read-only — `network`/`currency` default
to `solana`/`USDC` for documents that predate those fields — and are closed to new donations.
They're kept for now as test content and are slated for removal.
