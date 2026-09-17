import fs from 'node:fs';
import path from 'node:path';
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory()){if(e.name!=='api')walk(p);continue;}if(!p.endsWith('.tsx'))continue;let s=fs.readFileSync(p,'utf8');s=s.replace(/bg-primary text-foreground/g,'bg-primary text-primary-foreground').replace(/file:text-foreground/g,'file:text-primary-foreground').replace('!text-foreground','!text-primary-foreground');fs.writeFileSync(p,s);}}
walk('app');walk('components');
let p='config/platform.ts',s=fs.readFileSync(p,'utf8').replace("ticker: 'PLACEHOLDER'","ticker: 'OPEN'");fs.writeFileSync(p,s);
p='components/modals/CoinCTAModal.tsx';s=fs.readFileSync(p,'utf8').replace('{PLATFORM_TOKEN.ticker}</DialogTitle>','${PLATFORM_TOKEN.ticker}</DialogTitle>').replace('We’re preparing our move to Ethereum and a new token launch on pons.','OpenFund is moving to Robinhood Chain, the Ethereum L2 used by pons.').replace('Ticker and address will be announced at launch.','The new $OPEN contract address will be announced at launch.');fs.writeFileSync(p,s);
p='app/page.tsx';s=fs.readFileSync(p,'utf8').replace('New token launch on pons. Ethereum migration in progress.','Moving to Robinhood Chain (4663), the network used by pons.').replace('<summary>{PLATFORM_TOKEN.ticker}','<summary>${PLATFORM_TOKEN.ticker}');fs.writeFileSync(p,s);
