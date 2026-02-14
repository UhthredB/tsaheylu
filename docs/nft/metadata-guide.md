# NFT Metadata Upload Guide

## What You Need

### For 100 NFTs, you need:
1. **100 image files** (1.png to 100.png or 1.jpg to 100.jpg)
2. **100 JSON metadata files** (1.json to 100.json)
3. **IPFS storage** (Pinata, NFT.Storage, or Filebase)

---

## Step 1: Create Your Images

### Requirements:
- **Format**: PNG (recommended) or JPG
- **Size**: 1000x1000px minimum (can be larger)
- **Naming**: `1.png`, `2.png`, ... `100.png` (or .jpg)
- **Quality**: High resolution for marketplaces

### Tools:
- Adobe Photoshop / Illustrator
- Procreate (iPad)
- GIMP (free)
- Canva (web-based)
- Generative art scripts

### Example Structure:
```
/images/
  ├── 1.png
  ├── 2.png
  ├── ...
  └── 100.png
```

---

## Step 2: Upload Images to IPFS

### Option A: Using Pinata (Recommended)

1. **Sign up**: https://pinata.cloud (Free tier: 1GB)

2. **Upload folder**:
   - Click "Upload" → "Folder"
   - Select your `/images/` folder
   - Name it: "ayvitraya-images"
   - Click "Upload"

3. **Get CID**:
   - Copy the IPFS CID (e.g., `QmAbc123...`)
   - Save this! You'll need it for metadata

4. **Test**:
   ```bash
   curl -I https://ipfs.io/ipfs/YOUR_IMAGE_CID/1.png
   # Should return HTTP 200
   ```

### Option B: Using NFT.Storage (Free, permanent)

1. **Sign up**: https://nft.storage
2. **Get API key**
3. **Upload via website** or API
4. **Get CID**

---

## Step 3: Create Metadata Files

### Metadata Structure

Each NFT needs a JSON file matching this format:

**File: `1.json`**
```json
{
  "name": "Ay Vitraya First Hundred #1",
  "description": "Description of this NFT. Part of the Ay Vitraya First Hundred collection representing [concept]. This is NFT #1 of only 100 ever created.",
  "image": "ipfs://QmYourImageCID/1.png",
  "external_url": "https://ayvitraya.com/nft/1",
  "attributes": [
    {
      "trait_type": "Tier",
      "value": "Tier 1"
    },
    {
      "trait_type": "Rarity",
      "value": "Common"
    },
    {
      "trait_type": "Background",
      "value": "Blue"
    },
    {
      "trait_type": "Element",
      "value": "Water"
    },
    {
      "display_type": "number",
      "trait_type": "Token ID",
      "value": 1
    }
  ]
}
```

### Key Fields:

- **name**: Unique name for this NFT
- **description**: What this NFT represents (can be same for all)
- **image**: `ipfs://YOUR_IMAGE_CID/1.png` ← Use image CID from Step 2
- **external_url**: Your website (optional)
- **attributes**: Traits that show up on marketplaces

### Attribute Types:

**Text Traits:**
```json
{
  "trait_type": "Background",
  "value": "Red"
}
```

**Numeric Traits:**
```json
{
  "display_type": "number",
  "trait_type": "Power Level",
  "value": 95
}
```

**Date Traits:**
```json
{
  "display_type": "date",
  "trait_type": "Minted Date",
  "value": 1708012800
}
```

### Example: Create All 100 Metadata Files

**Script: `generate-metadata.ts`** (Already in your project)
```typescript
import { writeFileSync } from 'fs';

const IMAGE_CID = 'QmYourImageCID'; // From Step 2

for (let i = 1; i <= 100; i++) {
  // Determine tier
  let tier = 1;
  let price = 10;
  if (i > 70 && i <= 90) { tier = 2; price = 25; }
  if (i > 90) { tier = 3; price = 50; }

  // Determine rarity (example)
  let rarity = 'Common';
  if (i % 10 === 0) rarity = 'Rare';
  if (i === 100) rarity = 'Legendary';

  const metadata = {
    name: `Ay Vitraya First Hundred #${i}`,
    description: `A sacred NFT from the Ay Vitraya First Hundred collection. This is token #${i} of 100, representing [your concept here].`,
    image: `ipfs://${IMAGE_CID}/${i}.png`,
    external_url: `https://ayvitraya.com/nft/${i}`,
    attributes: [
      { trait_type: 'Tier', value: `Tier ${tier}` },
      { trait_type: 'Rarity', value: rarity },
      { trait_type: 'Original Price', value: `$${price} USDC` },
      { display_type: 'number', trait_type: 'Token ID', value: i },
      { display_type: 'number', trait_type: 'Edition Size', value: 100 },
    ],
  };

  writeFileSync(
    `metadata/${i}.json`,
    JSON.stringify(metadata, null, 2)
  );
}

console.log('✅ Generated 100 metadata files');
```

Run it:
```bash
npx tsx src/nft/metadata/generate-metadata.ts
```

---

## Step 4: Upload Metadata to IPFS

### Using Pinata:

1. **Upload folder**:
   - Click "Upload" → "Folder"
   - Select your `/metadata/` folder
   - Name it: "ayvitraya-metadata"
   - Click "Upload"

2. **Get CID**:
   - Copy the metadata CID (e.g., `QmDef456...`)
   - This is your **NFT_BASE_URI**

3. **Test**:
   ```bash
   curl https://ipfs.io/ipfs/YOUR_METADATA_CID/1.json
   curl https://ipfs.io/ipfs/YOUR_METADATA_CID/100.json
   ```

---

## Step 5: Update Your Contract

### Before Deployment:
```bash
# Set in .env
NFT_BASE_URI=ipfs://YOUR_METADATA_CID/
```

### After Deployment (if changing):
```bash
cast send <CONTRACT_ADDRESS> "setBaseURI(string)" \
  "ipfs://YOUR_METADATA_CID/" \
  --rpc-url <RPC_URL> \
  --private-key $PRIVATE_KEY
```

---

## IPFS Pinning (CRITICAL)

### Why Pin?

Files on IPFS disappear if not pinned. If your metadata unpins, your NFTs will show as broken.

### How to Pin:

**Pinata:**
- Free tier: 1GB
- Paid: $20/month for more storage
- Files stay pinned as long as account is active

**NFT.Storage:**
- Permanently free
- Backed by Filecoin
- Best for permanent storage

**Filebase:**
- S3-compatible
- $5.99/month minimum
- More control

### Check Pin Status:
```bash
# Pinata Dashboard
https://app.pinata.cloud/pinmanager

# Or via API
curl https://api.pinata.cloud/data/pinList \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## Marketplace Standards

### OpenSea Requirements:
- ✅ JSON format
- ✅ `name` field
- ✅ `description` field
- ✅ `image` field (IPFS or HTTPS)
- ✅ `attributes` array (for traits)

### LooksRare / Blur:
- Same as OpenSea

### Rarible:
- Supports additional fields like `animation_url`

---

## Common Issues

### Issue: Metadata not showing
**Fix**: Check IPFS gateway
```bash
# Try different gateways
https://ipfs.io/ipfs/YOUR_CID/1.json
https://gateway.pinata.cloud/ipfs/YOUR_CID/1.json
https://cloudflare-ipfs.com/ipfs/YOUR_CID/1.json
```

### Issue: Images not loading
**Fix**: Verify image URLs in JSON
```bash
# Should be:
"image": "ipfs://QmImageCID/1.png"

# NOT:
"image": "https://ipfs.io/ipfs/QmImageCID/1.png"
```

### Issue: Traits not showing on OpenSea
**Fix**: Check attribute format
```json
// ✅ Correct
"attributes": [
  { "trait_type": "Background", "value": "Blue" }
]

// ❌ Wrong
"traits": { "Background": "Blue" }
```

---

## Checklist Before Deployment

- [ ] All 100 images uploaded to IPFS
- [ ] Image CID saved
- [ ] All 100 metadata files created
- [ ] Metadata references correct image CID
- [ ] All metadata uploaded to IPFS
- [ ] Metadata CID saved
- [ ] Files pinned on paid service
- [ ] Tested sample metadata URLs
- [ ] Tested sample image URLs
- [ ] NFT_BASE_URI set correctly
- [ ] Base URI ends with `/`

---

## Quick Reference

### File Structure:
```
/ayvitraya-nft/
├── /images/
│   ├── 1.png
│   ├── 2.png
│   └── ... 100.png
│
└── /metadata/
    ├── 1.json
    ├── 2.json
    └── ... 100.json
```

### URLs:
```
Images IPFS: ipfs://QmImageCID/1.png
Metadata IPFS: ipfs://QmMetaCID/1.json
Contract BaseURI: ipfs://QmMetaCID/
```

### Test Commands:
```bash
# Test metadata
curl https://ipfs.io/ipfs/QmMetaCID/1.json

# Test image
curl -I https://ipfs.io/ipfs/QmImageCID/1.png

# Verify JSON structure
cat metadata/1.json | jq .
```

---

**Remember**: Once deployed, metadata should be permanent. Pin everything on a reliable service!
