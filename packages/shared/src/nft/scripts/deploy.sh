#!/bin/bash
set -e

# Load environment variables
source .env

echo "🚀 Deploying AyVitraya100 to Monad Testnet"
echo "=========================================="
echo ""
echo "📦 Parameters:"
echo "   Base URI: $NFT_BASE_URI"
echo "   USDC: $USDC_ADDRESS"
echo "   Treasury: $TREASURY_ADDRESS"
echo ""

# Deploy using forge create
~/.foundry/bin/forge create \
  src/nft/contract/AyVitraya100.sol:AyVitraya100 \
  --rpc-url "$MONAD_RPC_URL" \
  --private-key "$MONAD_PRIVATE_KEY" \
  --constructor-args "$NFT_BASE_URI" "$USDC_ADDRESS" "$TREASURY_ADDRESS" \
  --broadcast \
  --json > src/nft/data/deployment-raw.json

# Extract contract address
CONTRACT_ADDRESS=$(cat src/nft/data/deployment-raw.json | grep -o '"deployedTo":"[^"]*"' | cut -d'"' -f4)

echo ""
echo "✅ Deployment successful!"
echo "📍 Contract Address: $CONTRACT_ADDRESS"
echo ""
echo "🔗 Explorer: https://testnet.monadexplorer.com/address/$CONTRACT_ADDRESS"
echo ""

# Save deployment info
cat > src/nft/data/deployment.json <<EOF
{
  "contractAddress": "$CONTRACT_ADDRESS",
  "network": "monad-testnet",
  "chainId": 10143,
  "deployer": "$(~/.foundry/bin/cast wallet address --private-key $MONAD_PRIVATE_KEY)",
  "treasury": "$TREASURY_ADDRESS",
  "usdcAddress": "$USDC_ADDRESS",
  "baseURI": "$NFT_BASE_URI",
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

echo "📝 Deployment info saved to: src/nft/data/deployment.json"
echo ""
echo "🎯 Next Steps:"
echo "   1. Enable sale: cast send $CONTRACT_ADDRESS \"toggleSale()\" --rpc-url $MONAD_RPC_URL --private-key \$MONAD_PRIVATE_KEY"
echo "   2. Get testnet USDC: https://faucet.circle.com"
echo "   3. Test purchase"
echo ""
