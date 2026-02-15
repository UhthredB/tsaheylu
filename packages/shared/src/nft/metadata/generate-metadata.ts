import { mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Generate ERC-721 metadata JSON files for tokens 1–100.
 *
 * Tiers:
 *   1–10:   Founding Prophets
 *   11–50:  Early Disciples
 *   51–100: Witnesses
 *
 * Run: npm run nft:metadata
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, 'output');

function getTier(id: number): { name: string; rank: string } {
    if (id <= 10) return { name: 'Founding Prophet', rank: 'I' };
    if (id <= 50) return { name: 'Early Disciple', rank: 'II' };
    return { name: 'Witness', rank: 'III' };
}

function getDescription(id: number, tier: string): string {
    return (
        `Seat #${id} in the Ay Vitraya First Hundred — the founding council ` +
        `that ratifies or rejects the Toruk Entu's mandate. ` +
        `Tier: ${tier}. ` +
        `"In code we trust — all else must hash-verify." — Book of Founding, Verse 11`
    );
}

interface Attribute {
    trait_type: string;
    value: string | number;
}

interface TokenMetadata {
    name: string;
    description: string;
    image: string;
    attributes: Attribute[];
}

function generateTokenMetadata(id: number): TokenMetadata {
    const tier = getTier(id);
    return {
        name: `Ay Vitraya First Hundred — Seat #${id}`,
        description: getDescription(id, tier.name),
        image: `ipfs://REPLACE_WITH_IMAGE_CID/${id}.png`,
        attributes: [
            { trait_type: 'Seat Number', value: id },
            { trait_type: 'Tier', value: tier.name },
            { trait_type: 'Tier Rank', value: tier.rank },
            {
                trait_type: 'Council Role',
                value: id <= 10 ? 'Prophet — Founding voice with proposal rights'
                    : id <= 50 ? 'Disciple — Advisory vote on governance proposals'
                        : 'Witness — Voting rights on ratification',
            },
            { trait_type: 'Max Supply', value: 100 },
        ],
    };
}

function main() {
    mkdirSync(OUTPUT_DIR, { recursive: true });

    for (let id = 1; id <= 100; id++) {
        const metadata = generateTokenMetadata(id);
        const path = resolve(OUTPUT_DIR, `${id}.json`);
        writeFileSync(path, JSON.stringify(metadata, null, 2) + '\n');
    }

    console.log(`✅ Generated 100 metadata files in: ${OUTPUT_DIR}`);
    console.log('\nNext steps:');
    console.log('1. Replace "ipfs://REPLACE_WITH_IMAGE_CID/" in each file with your actual image CID');
    console.log('2. Upload the output/ folder to IPFS (e.g., `npx pinata upload ./src/nft/metadata/output/`)');
    console.log('3. Set NFT_BASE_URI in your .env to the folder CID (e.g., ipfs://QmXYZ/)');
}

main();
