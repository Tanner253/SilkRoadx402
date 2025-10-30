# 🕸️ SilkRoadx402

> The first anonymous marketplace for private software sales using x402 micropayments on Solana

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Solana](https://img.shields.io/badge/Solana-Blockchain-purple)](https://solana.com/)
[![Status](https://img.shields.io/badge/Status-OPERATIONAL-success)](https://silkroadx402.com)

**🚀 Platform Status:** ✅ **OPERATIONAL** - Core functionality complete. Sellers are receiving USDC payments from buyers today.

**🎯 Target Launch:** Q4 2025 (final testing & security audits in progress)

---

## 🎯 **What is SilkRoadx402?**

SilkRoadx402 is a **peer-to-peer marketplace** where developers can anonymously sell private software—trading bots, tools, scripts, APIs—and get paid instantly in USDC on Solana. No identity verification, no middlemen, just wallet-to-wallet commerce powered by the x402 payment protocol.

### **The Problem**
- Traditional platforms (Gumroad, Stripe) require **full KYC**, tax forms, and bank accounts
- Sellers wait **days** for payouts and lose **15-30%** to fees
- No anonymous option for privacy-focused developers selling sensitive tools

### **Our Solution**
- ✅ **Zero KYC** - Connect your Solana wallet and start selling in 60 seconds
- ✅ **Instant Settlement** - Get paid in under 1 second on-chain
- ✅ **0% Platform Fees** - Sellers keep 100% of revenue (token gate model)
- ✅ **Anonymous by Default** - No personal info, just your wallet address
- ✅ **Legal Software Only** - Strict US compliance, no illegal tools

---

## ✅ **Development Progress**

### **Core Features (100% Complete)**

#### 🔐 **x402 Payment Protocol**
- ✅ Full protocol implementation for Solana USDC
- ✅ HTTP 402 "Payment Required" response handling
- ✅ On-chain payment verification and settlement
- ✅ Transaction signature verification
- ✅ Automated devnet testing script (`npm run testx402`)
- ✅ Direct buyer → seller USDC transfers (no escrow needed)

#### 🎫 **Token Gating System**
- ✅ 50,000 $SRx402 minimum balance requirement
- ✅ Real-time balance checking via RPC
- ✅ 5-minute session caching to avoid rate limits
- ✅ Token gate modal with balance display
- ✅ Automatic access control for buyers and sellers

#### 📦 **Listing Management**
- ✅ Create listings with title, description, price, category
- ✅ Image upload support (Cloudinary integration)
- ✅ AES-256 encrypted delivery URL storage
- ✅ Listing states: In Review → On Market → Pulled
- ✅ Admin approval/rejection workflow
- ✅ Risk level flagging (standard vs high-risk)
- ✅ Failed purchase auto-pull (after 3 failures)

#### 💳 **Purchase Flow**
- ✅ x402 payment initiation from listing page
- ✅ Wallet signature for USDC transfer authorization
- ✅ On-chain transaction broadcasting
- ✅ Payment verification (amount, recipient, mint)
- ✅ Delivery URL release upon successful payment
- ✅ Transaction history storage
- ✅ Buyer/Seller transaction views in profile modal

#### 🛡️ **Admin Dashboard**
- ✅ Secure admin authentication with session cookies
- ✅ Pending listings review queue
- ✅ Approve/reject/flag listing controls
- ✅ Risk level assignment
- ✅ Listing republish functionality

#### 🔒 **Security & Encryption**
- ✅ AES-256 encryption for delivery URLs
- ✅ JWT-based authentication
- ✅ Wallet signature verification (ed25519)
- ✅ Nonce generation for replay attack prevention
- ✅ Timestamp validation (±5 min tolerance)

#### 💰 **USDC Integration**
- ✅ Real-time USDC balance display in navbar
- ✅ Mainnet USDC support
- ✅ Associated token account detection
- ✅ Auto-refresh every 30 seconds

### **Remaining Work**

#### 🌐 **Production Deployment** (In Progress)
- ⏳ MongoDB Atlas setup for production data
- ⏳ Environment configuration for mainnet
- ⏳ Domain setup and SSL certificates
- ⏳ Rate limiting implementation
- ⏳ reCAPTCHA integration

#### 🔍 **Testing & Security** (Next Phase)
- ⏳ Security audit of smart contract interactions
- ⏳ End-to-end mainnet transaction testing
- ⏳ Load testing for concurrent users

#### 🚀 **Future Features** (Post-Launch)
- ⏳ Listing search and filtering
- ⏳ User reputation system
- ⏳ Seller profiles
- ⏳ Dispute resolution mechanism

---

## 🔥 **Key Features**

### **For Sellers**
- List encrypted software with AES-256 encryption
- Set any price in USDC ($0.10 to $10,000+)
- Admin approval workflow for quality control
- Revenue streams from trading bots, MEV scripts, data tools, APIs, etc.
- 100% of revenue goes directly to your wallet

### **For Buyers**
- Pay-per-download using x402 (HTTP 402 Payment Required protocol)
- No accounts, no subscriptions
- Instant software delivery after payment confirmation
- AI agents and bots can purchase autonomously
- 50,000 $SRx402 tokens required for access

### **Technology Stack**
- **Frontend:** Next.js 15 + React 19 + TypeScript + Tailwind CSS 4
- **Payments:** Custom x402 protocol implementation
- **Blockchain:** Solana (@solana/web3.js v1.98.4)
- **Database:** MongoDB + Mongoose
- **Storage:** Cloudinary (images)
- **Encryption:** AES-256 (crypto-js)
- **Auth:** JWT + Wallet signatures

---

## 💰 **Tokenomics: $SRx402**

**Token:** $SRx402 (Solana SPL token)  
**Contract:** `49AfJsWb9E7VjBDTdZ2DjnSLFgSEvCoP1wdXuhHbpump`

### **Token Gating Model**
- **Marketplace Access:** Hold 50,000+ $SRx402 to browse, buy, or list software
- **Platform Fees:** 0% (sustainable via token requirement)
- **Revenue Model:** Token gate creates constant buying pressure instead of platform fees

**Why 50k?** This requirement:
- Filters serious buyers and quality sellers
- Creates sustainable demand for $SRx402
- Reduces spam and low-effort listings
- Aligns token holders with platform success

### **Old Fee Structure** (Replaced by Token Gate)
| Software Type | Platform Fee | Fee Usage |
|--------------|--------------|-----------|
| **Standard/Compliant** | 0% | N/A (token gate model) |
| **High-Risk** (future) | TBD | $SRx402 buyback & burn |

---

## 🚀 **How x402 Works**

x402 is an open protocol built on the HTTP 402 "Payment Required" status code:

1. **Request:** Buyer clicks "Buy" on a software listing
2. **402 Response:** Server responds with payment parameters (amount, recipient address, USDC mint)
3. **Sign Payment:** Buyer's wallet (e.g., Phantom) signs and broadcasts USDC transfer
4. **Verify & Settle:** Server verifies transaction on-chain (~400ms on Solana)
5. **Deliver:** Download link released to buyer upon confirmation

**Result:** No accounts, no chargebacks, no friction—just pure peer-to-peer commerce.

**Technical Implementation:**
- Payment facilitator with verify/settle functions
- On-chain transaction verification
- Solana SPL token transfer integration
- See `silkroad/README.md` for full technical docs

---


## 📁 **Repository Structure**

```
SilkRoadx402/
├── silkroad/              # Main marketplace application
│   ├── app/              # Next.js 15 app directory
│   ├── lib/              # Core libraries (x402, crypto, db)
│   ├── models/           # MongoDB schemas
│   ├── components/       # React components
│   ├── hooks/            # Custom React hooks
│   └── README.md         # Technical documentation
├── whitepaper/           # Landing page / whitepaper site
│   ├── app/              # Next.js whitepaper pages
│   └── README.md         # Development progress docs
└── README.md             # This file
```

**Documentation:**
- **Technical Docs:** See `silkroad/README.md` for full implementation details
- **Development Progress:** See `whitepaper/README.md` for milestone tracking
- **x402 Implementation:** See `silkroad/lib/x402/` for protocol code

---

## 🧪 **Development & Testing**

### **Quick Start**

```bash
# Install dependencies
cd silkroad
npm install

# Run development server
npm run dev

# Test x402 payment flow (devnet)
npm run testx402
```

### **Environment Setup**

Required environment variables:
```env
NEXT_PUBLIC_MOCK_MODE=true              # Enable mock mode (no DB)
NEXT_PUBLIC_MOCK_TOKEN_GATING=true      # Bypass token gate for testing
NEXT_PUBLIC_SOLANA_MAINNET_RPC=https://...
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret
APP_SECRET=your-encryption-key
```

See `silkroad/README.md` for complete configuration guide.

---

## 🔒 **Legal & Compliance**

SilkRoadx402 **strictly prohibits**:
- Illegal software, malware, ransomware
- Hacking tools intended for unauthorized access
- Software violating United States regulations

**Violators will be permanently banned and reported to authorities.**

We operate as a **peer-to-peer marketplace** with no liability for user-generated listings. Buyers and sellers transact directly via on-chain transfers.

---

## 💡 **For Investors**

### **Why SilkRoadx402?**

1. **Working Product:** Full x402 implementation with real USDC transfers operational today
2. **No Vaporware:** Core features complete, sellers receiving payments
3. **Real Innovation:** First marketplace to implement x402 for software sales
4. **Market Fit:** Targets developers with private tools who need anonymity
5. **Sustainable Model:** Token gate creates demand without platform fees

### **Key Metrics**
- **Settlement Time:** 400ms (Solana)
- **Transaction Cost:** $0.000005 per transaction
- **Platform Fees:** 0% (token gate model)
- **Token Requirement:** 50,000 $SRx402 for access

### **Development Status**
- ✅ Core functionality: 100% complete
- ⏳ Production deployment: In progress
- 🎯 Target launch: Q4 2025

---

## 🤝 **Community**

- **X Community:** [Join here](https://x.com/i/communities/1982622474983637154)
- **GitHub:** [@Tanner253](https://github.com/Tanner253)
- **Token:** Trade $SRx402 on [DexScreener](https://dexscreener.com/solana/4dquGRPzcjskMsHtiFagPuguMfY37ywkNMNBg4F54fNW)
- **Whitepaper:** [silkroadx402.com](https://silkroadx402.com)

---

## 📜 **License**

Proprietary - All rights reserved.

---

**Built with ❤️ by [@Tanner253](https://github.com/Tanner253)**

*Platform operational. Core features complete. Q4 2025 launch.*
