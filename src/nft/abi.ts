/**
 * ABI for the AyVitraya100 ERC-721 contract.
 * Generated from the Solidity source. Only includes the functions we call from scripts.
 */
export const AyVitraya100ABI = [
    // --- Read functions ---
    {
        type: 'function',
        name: 'MAX_SUPPLY',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'totalMinted',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'name',
        inputs: [],
        outputs: [{ name: '', type: 'string' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'symbol',
        inputs: [],
        outputs: [{ name: '', type: 'string' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'tokenURI',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'string' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'ownerOf',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'address' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'balanceOf',
        inputs: [{ name: 'owner', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'owner',
        inputs: [],
        outputs: [{ name: '', type: 'address' }],
        stateMutability: 'view',
    },

    // --- Write functions ---
    {
        type: 'function',
        name: 'mint',
        inputs: [{ name: 'to', type: 'address' }],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'mintBatch',
        inputs: [
            { name: 'to', type: 'address' },
            { name: 'count', type: 'uint256' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'setBaseURI',
        inputs: [{ name: 'newBaseURI', type: 'string' }],
        outputs: [],
        stateMutability: 'nonpayable',
    },

    // --- Constructor (for deployment) ---
    {
        type: 'constructor',
        inputs: [{ name: 'baseURI', type: 'string' }],
        stateMutability: 'nonpayable',
    },
] as const;
