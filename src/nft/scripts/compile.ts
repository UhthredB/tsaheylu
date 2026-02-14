import solc from 'solc';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Compile AyVitraya100.sol using solc-js
 */

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read the contract source
const contractPath = resolve(__dirname, '../contract/AyVitraya100.sol');
const source = readFileSync(contractPath, 'utf-8');

// Prepare input for solc
const input = {
    language: 'Solidity',
    sources: {
        'AyVitraya100.sol': {
            content: source,
        },
        // Include OpenZeppelin imports
        '@openzeppelin/contracts/token/ERC721/ERC721.sol': {
            content: readFileSync(
                resolve(__dirname, '../../../node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol'),
                'utf-8'
            ),
        },
        '@openzeppelin/contracts/access/Ownable.sol': {
            content: readFileSync(
                resolve(__dirname, '../../../node_modules/@openzeppelin/contracts/access/Ownable.sol'),
                'utf-8'
            ),
        },
        '@openzeppelin/contracts/token/ERC721/IERC721.sol': {
            content: readFileSync(
                resolve(__dirname, '../../../node_modules/@openzeppelin/contracts/token/ERC721/IERC721.sol'),
                'utf-8'
            ),
        },
        '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol': {
            content: readFileSync(
                resolve(__dirname, '../../../node_modules/@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol'),
                'utf-8'
            ),
        },
        '@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol': {
            content: readFileSync(
                resolve(__dirname, '../../../node_modules/@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol'),
                'utf-8'
            ),
        },
        '@openzeppelin/contracts/utils/Context.sol': {
            content: readFileSync(
                resolve(__dirname, '../../../node_modules/@openzeppelin/contracts/utils/Context.sol'),
                'utf-8'
            ),
        },
        '@openzeppelin/contracts/utils/Strings.sol': {
            content: readFileSync(
                resolve(__dirname, '../../../node_modules/@openzeppelin/contracts/utils/Strings.sol'),
                'utf-8'
            ),
        },
        '@openzeppelin/contracts/utils/introspection/ERC165.sol': {
            content: readFileSync(
                resolve(__dirname, '../../../node_modules/@openzeppelin/contracts/utils/introspection/ERC165.sol'),
                'utf-8'
            ),
        },
        '@openzeppelin/contracts/utils/introspection/IERC165.sol': {
            content: readFileSync(
                resolve(__dirname, '../../../node_modules/@openzeppelin/contracts/utils/introspection/IERC165.sol'),
                'utf-8'
            ),
        },
        '@openzeppelin/contracts/interfaces/draft-IERC6093.sol': {
            content: readFileSync(
                resolve(__dirname, '../../../node_modules/@openzeppelin/contracts/interfaces/draft-IERC6093.sol'),
                'utf-8'
            ),
        },
        '@openzeppelin/contracts/utils/math/Math.sol': {
            content: readFileSync(
                resolve(__dirname, '../../../node_modules/@openzeppelin/contracts/utils/math/Math.sol'),
                'utf-8'
            ),
        },
        '@openzeppelin/contracts/utils/math/SignedMath.sol': {
            content: readFileSync(
                resolve(__dirname, '../../../node_modules/@openzeppelin/contracts/utils/math/SignedMath.sol'),
                'utf-8'
            ),
        },
    },
    settings: {
        optimizer: {
            enabled: true,
            runs: 200,
        },
        outputSelection: {
            '*': {
                '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode'],
            },
        },
    },
};

console.log('🔨 Compiling AyVitraya100.sol...');

const output = JSON.parse(solc.compile(JSON.stringify(input)));

// Check for errors
if (output.errors) {
    const errors = output.errors.filter((e: any) => e.severity === 'error');
    if (errors.length > 0) {
        console.error('❌ Compilation errors:');
        errors.forEach((err: any) => console.error(err.formattedMessage));
        process.exit(1);
    }
    // Show warnings
    const warnings = output.errors.filter((e: any) => e.severity === 'warning');
    if (warnings.length > 0) {
        console.warn('⚠️  Warnings:');
        warnings.forEach((warn: any) => console.warn(warn.formattedMessage));
    }
}

const contract = output.contracts['AyVitraya100.sol']['AyVitraya100'];

if (!contract) {
    console.error('❌ Contract not found in compilation output');
    process.exit(1);
}

const bytecode = '0x' + contract.evm.bytecode.object;
const abi = contract.abi;

console.log('✅ Compilation successful!');
console.log(`   Bytecode length: ${bytecode.length} characters`);
console.log(`   ABI functions: ${abi.filter((item: any) => item.type === 'function').length}`);

// Save bytecode
const bytecodeFile = resolve(__dirname, '../contract/bytecode.txt');
writeFileSync(bytecodeFile, bytecode);
console.log(`\n📝 Bytecode saved to: ${bytecodeFile}`);

// Save ABI
const abiFile = resolve(__dirname, '../contract/abi.json');
writeFileSync(abiFile, JSON.stringify(abi, null, 2));
console.log(`📝 ABI saved to: ${abiFile}`);

console.log('\n👉 Next step: Copy the bytecode from bytecode.txt and paste it into deploy.ts (line 53)');
