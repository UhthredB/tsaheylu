"use client";

import { useState, useEffect } from "react";

// Contract configuration
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ANURAI50_ADDRESS || "";
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS || "";
const PRICE_USDC = 100; // $100 USDC per NFT
const MAX_SUPPLY = 50;

// Minimal ABI for the functions we need
const ANURAI50_ABI = [
  {
    "inputs": [],
    "name": "purchase",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "count", "type": "uint256"}],
    "name": "purchaseBatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalMinted",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "saleActive",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const USDC_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "address", "name": "spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function MintPage() {
  const [account, setAccount] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [totalMinted, setTotalMinted] = useState(0);
  const [saleActive, setSaleActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    checkConnection();
    if (CONTRACT_ADDRESS) {
      loadContractData();
    }
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
      } catch (err) {
        console.error("Error checking connection:", err);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      setError("Please install MetaMask or another Web3 wallet");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
      setStatus("Wallet connected!");
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
    } finally {
      setLoading(false);
    }
  };

  const loadContractData = async () => {
    if (typeof window.ethereum === "undefined" || !CONTRACT_ADDRESS) return;

    try {
      const provider = window.ethereum;

      // Get total minted
      const mintedData = await provider.request({
        method: "eth_call",
        params: [{
          to: CONTRACT_ADDRESS,
          data: "0x4c0f38c2" // totalMinted() function selector
        }, "latest"]
      });
      const minted = parseInt(mintedData, 16);
      setTotalMinted(minted);

      // Get sale active status
      const saleData = await provider.request({
        method: "eth_call",
        params: [{
          to: CONTRACT_ADDRESS,
          data: "0x68428a1b" // saleActive() function selector
        }, "latest"]
      });
      const active = parseInt(saleData, 16) === 1;
      setSaleActive(active);
    } catch (err) {
      console.error("Error loading contract data:", err);
    }
  };

  const mintNFT = async () => {
    if (!account) {
      setError("Please connect your wallet first");
      return;
    }

    if (!CONTRACT_ADDRESS || !USDC_ADDRESS) {
      setError("Contract addresses not configured. Please set NEXT_PUBLIC_ANURAI50_ADDRESS and NEXT_PUBLIC_USDC_ADDRESS");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setStatus("Approving USDC...");

      const provider = window.ethereum;
      const amountInUSDC = BigInt(PRICE_USDC * quantity * 1e6); // USDC has 6 decimals

      // Step 1: Approve USDC
      const approveData = provider.request({
        method: "eth_sendTransaction",
        params: [{
          from: account,
          to: USDC_ADDRESS,
          data: `0x095ea7b3${CONTRACT_ADDRESS.slice(2).padStart(64, '0')}${amountInUSDC.toString(16).padStart(64, '0')}`
        }]
      });

      await approveData;
      setStatus("USDC approved! Minting NFT...");

      // Step 2: Purchase NFT
      let purchaseData;
      if (quantity === 1) {
        purchaseData = "0xefef39a1"; // purchase() function selector
      } else {
        purchaseData = `0x3ccfd60b${quantity.toString(16).padStart(64, '0')}`; // purchaseBatch(uint256)
      }

      const txHash = await provider.request({
        method: "eth_sendTransaction",
        params: [{
          from: account,
          to: CONTRACT_ADDRESS,
          data: purchaseData
        }]
      });

      setStatus("Transaction submitted! Waiting for confirmation...");

      // Wait for transaction confirmation
      let receipt = null;
      while (!receipt) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        receipt = await provider.request({
          method: "eth_getTransactionReceipt",
          params: [txHash]
        });
      }

      if (receipt.status === "0x1") {
        setStatus(`Success! You minted ${quantity} NFT${quantity > 1 ? 's' : ''}!`);
        loadContractData(); // Refresh contract data
      } else {
        setError("Transaction failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to mint NFT");
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  const totalCost = PRICE_USDC * quantity;
  const remaining = MAX_SUPPLY - totalMinted;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8" style={{ background: '#F5F5F0' }}>
      {/* Back button */}
      <div className="absolute top-8 left-8">
        <a href="/flow" className="text-black/60 hover:text-black transition-colors text-sm uppercase tracking-wider">
          ← Back
        </a>
      </div>

      {/* Main mint card */}
      <div className="w-full max-w-2xl bg-white rounded-[40px] p-12 border-4 border-black shadow-2xl">
        <h1 className="text-5xl md:text-6xl font-black uppercase mb-8 text-black text-center">
          MINT ANURAI
        </h1>

        {/* Supply info */}
        <div className="bg-black/5 rounded-2xl p-6 mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold uppercase text-black/60">Supply</span>
            <span className="text-2xl font-black text-black">{totalMinted} / {MAX_SUPPLY}</span>
          </div>
          <div className="w-full bg-black/10 rounded-full h-3">
            <div
              className="rounded-full h-3 transition-all duration-500"
              style={{
                width: `${(totalMinted / MAX_SUPPLY) * 100}%`,
                background: '#C41230'
              }}
            />
          </div>
          <p className="text-sm text-black/50 mt-2 text-center">
            {remaining} remaining
          </p>
        </div>

        {/* Sale status */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className={`w-3 h-3 rounded-full ${saleActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-sm font-bold uppercase">
            {saleActive ? "Sale Active" : "Sale Not Active"}
          </span>
        </div>

        {/* Wallet connection */}
        {!account ? (
          <button
            onClick={connectWallet}
            disabled={loading}
            className="w-full py-6 rounded-full font-black text-white text-xl uppercase transition-transform hover:scale-[1.02] disabled:opacity-50"
            style={{ background: '#C41230' }}
          >
            {loading ? "Connecting..." : "Connect Wallet"}
          </button>
        ) : (
          <>
            {/* Connected address */}
            <div className="bg-black/5 rounded-2xl p-4 mb-6 text-center">
              <p className="text-xs uppercase text-black/50 mb-1">Connected</p>
              <p className="text-sm font-mono text-black">
                {account.slice(0, 6)}...{account.slice(-4)}
              </p>
            </div>

            {/* Quantity selector */}
            <div className="mb-6">
              <label className="block text-sm font-bold uppercase text-black/60 mb-3">
                Quantity (max 10)
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 rounded-full bg-black/10 hover:bg-black/20 font-black text-xl"
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                  className="flex-1 text-center text-3xl font-black bg-black/5 rounded-2xl py-4"
                  min="1"
                  max="10"
                />
                <button
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  className="w-12 h-12 rounded-full bg-black/10 hover:bg-black/20 font-black text-xl"
                >
                  +
                </button>
              </div>
            </div>

            {/* Cost display */}
            <div className="bg-black rounded-2xl p-6 mb-6">
              <div className="flex justify-between items-center text-white">
                <span className="text-lg uppercase font-bold">Total Cost</span>
                <span className="text-3xl font-black">${totalCost} USDC</span>
              </div>
            </div>

            {/* Mint button */}
            <button
              onClick={mintNFT}
              disabled={loading || !saleActive || remaining === 0}
              className="w-full py-6 rounded-full font-black text-white text-xl uppercase transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#C41230' }}
            >
              {loading ? "Processing..." : remaining === 0 ? "Sold Out" : !saleActive ? "Sale Inactive" : `Mint ${quantity} NFT${quantity > 1 ? 's' : ''}`}
            </button>
          </>
        )}

        {/* Status messages */}
        {status && (
          <div className="mt-6 p-4 rounded-2xl bg-green-500/10 border-2 border-green-500/30">
            <p className="text-green-700 text-center font-bold">{status}</p>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 rounded-2xl bg-red-500/10 border-2 border-red-500/30">
            <p className="text-red-700 text-center font-bold">{error}</p>
          </div>
        )}

        {/* Price info */}
        <div className="mt-8 pt-6 border-t-2 border-black/10">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xs uppercase text-black/50 mb-1">Price per NFT</p>
              <p className="text-2xl font-black text-black">${PRICE_USDC}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-black/50 mb-1">Payment</p>
              <p className="text-2xl font-black text-black">USDC</p>
            </div>
          </div>
        </div>
      </div>

    </main>
  );
}
