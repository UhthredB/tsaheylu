import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

// Create placeholder metadata for testing

const placeholderMetadata = {
    name: "Ay Vitraya First Hundred - Unrevealed",
    description: "This NFT will be revealed soon. Part of the Ay Vitraya First Hundred collection.",
    image: "ipfs://QmYSK2JyM9qNw4aVDrr6Gx5bBVTv3VRkKNQbcyVB3HtKSg/placeholder.png", // Generic placeholder
    attributes: [
        {
            trait_type: "Status",
            value: "Unrevealed"
        },
        {
            trait_type: "Collection",
            value: "Ay Vitraya First Hundred"
        }
    ]
};

const outputDir = resolve(process.cwd(), 'src/nft/metadata/placeholder');
mkdirSync(outputDir, { recursive: true });

// Create 100 identical placeholder files
console.log('Creating 100 placeholder metadata files...\n');

for (let i = 1; i <= 100; i++) {
    const metadata = {
        ...placeholderMetadata,
        name: `${placeholderMetadata.name} #${i}`,
        attributes: [
            ...placeholderMetadata.attributes,
            {
                trait_type: "Token ID",
                value: i.toString()
            }
        ]
    };

    const filename = `${i}.json`;
    const filepath = resolve(outputDir, filename);
    writeFileSync(filepath, JSON.stringify(metadata, null, 2));

    if (i % 10 === 0) {
        console.log(`✅ Created ${i}/100 files`);
    }
}

console.log('\n✅ All placeholder metadata created!');
console.log(`📁 Location: ${outputDir}`);
console.log('\n📝 Next steps:');
console.log('1. Upload this folder to IPFS (use Pinata or NFT.storage)');
console.log('2. Get the IPFS CID');
console.log('3. Call setBaseURI("ipfs://YOUR_CID/")');
console.log('\n💡 When ready with real artwork:');
console.log('1. Create 100 unique images');
console.log('2. Create 100 unique JSON files with real metadata');
console.log('3. Upload to IPFS');
console.log('4. Call setBaseURI again with new CID');
