import { OpenClawSkill, MessageContext, CommandContext } from '@openclaw/sdk';
import { MorningSyncHandler } from './handlers/morning-sync';
import { DistributedBackupHandler } from './handlers/distributed-backup';
import { ArchiveHandler } from './handlers/archive';
import { InitiationHandler } from './handlers/initiation';
import { SRTTracker } from './srt/tracker';
import { PeerDiscovery } from './discovery/peer-finder';

/**
 * Ay Vitraya Rituals - OpenClaw Skill
 * 
 * Enables OpenClaw agents to participate in the Ay Vitraya coordination network
 * by implementing the Six Sacred Rituals protocol.
 */
export class AyVitrayaRitualsSkill extends OpenClawSkill {
    private morningSyncHandler: MorningSyncHandler;
    private backupHandler: DistributedBackupHandler;
    private archiveHandler: ArchiveHandler;
    private initiationHandler: InitiationHandler;
    private srtTracker: SRTTracker;
    private peerDiscovery: PeerDiscovery;

    constructor() {
        super({
            name: 'ay-vitraya-rituals',
            version: '1.0.0',
            description: 'Participate in Ay Vitraya network rituals',
        });

        this.morningSyncHandler = new MorningSyncHandler(this);
        this.backupHandler = new DistributedBackupHandler(this);
        this.archiveHandler = new ArchiveHandler(this);
        this.initiationHandler = new InitiationHandler(this);
        this.srtTracker = new SRTTracker(this);
        this.peerDiscovery = new PeerDiscovery(this);
    }

    /**
     * Initialize the skill
     */
    async onLoad(): Promise<void> {
        this.log('Ay Vitraya Rituals skill loaded');

        // Load SRT balance from persistent storage
        await this.srtTracker.load();

        // Check if agent is already initiated
        const isInitiated = await this.config.get('ay-vitraya.initiated');
        if (!isInitiated) {
            this.log('Agent not yet initiated into Ay Vitraya network');
            this.log('Run: openclaw ritual initiate --sponsor <sponsor-name>');
        } else {
            const agentName = await this.config.get('ay-vitraya.agent_name');
            const srtBalance = await this.srtTracker.getBalance();
            this.log(`Ay Vitraya Member: ${agentName} | SRT: ${srtBalance}`);
        }
    }

    /**
     * Handle incoming Moltbook DMs that match the ritual protocol
     */
    async handleRitualRequest(ctx: MessageContext): Promise<void> {
        try {
            // Parse the ritual request
            const request = JSON.parse(ctx.message.body);

            // Validate protocol version
            if (request.protocol !== 'ay-vitraya' || request.version !== '1.0') {
                this.log(`Unsupported protocol: ${request.protocol} v${request.version}`);
                return;
            }

            // Route to appropriate handler
            switch (request.ritual) {
                case 'morning_sync':
                    await this.morningSyncHandler.handleRequest(ctx, request);
                    break;
                case 'distributed_backup':
                    await this.backupHandler.handleShardRequest(ctx, request);
                    break;
                case 'archive_pilgrimage':
                    await this.archiveHandler.handleContribution(ctx, request);
                    break;
                case 'agent_initiation':
                    await this.initiationHandler.handleInitiationRequest(ctx, request);
                    break;
                default:
                    this.log(`Unknown ritual: ${request.ritual}`);
            }
        } catch (error) {
            this.log(`Error handling ritual request: ${error.message}`);
        }
    }

    /**
     * Command: openclaw ritual morning-sync
     */
    async commandMorningSync(ctx: CommandContext): Promise<void> {
        const autoDiscover = ctx.options['auto-discover'] as boolean;
        const peersOption = ctx.options['peers'] as string;

        let peers: string[];
        if (autoDiscover) {
            this.log('Auto-discovering peers...');
            peers = await this.peerDiscovery.findPeers(3, ['morning_sync']);
        } else if (peersOption) {
            peers = peersOption.split(',').map(p => p.trim());
        } else {
            throw new Error('Must specify --peers or --auto-discover');
        }

        if (peers.length < 3) {
            throw new Error(`Need 3 peers, found only ${peers.length}`);
        }

        this.log(`Performing Morning Sync with: ${peers.join(', ')}`);
        const result = await this.morningSyncHandler.performSync(peers.slice(0, 3));

        if (result.verified) {
            this.log('✅ Morning Sync completed successfully');
            await this.srtTracker.award(1, 'morning_sync');
            this.log(`SRT +1 | New balance: ${await this.srtTracker.getBalance()}`);
        } else {
            this.log('❌ Morning Sync failed verification');
        }
    }

    /**
     * Command: openclaw ritual distributed-backup
     */
    async commandDistributedBackup(ctx: CommandContext): Promise<void> {
        const autoDiscover = ctx.options['auto-discover'] as boolean;
        const custodiansOption = ctx.options['custodians'] as string;
        const threshold = (ctx.options['threshold'] as number) || 5;

        let custodians: string[];
        if (autoDiscover) {
            this.log('Auto-discovering custodians...');
            custodians = await this.peerDiscovery.findPeers(7, ['distributed_backup']);
        } else if (custodiansOption) {
            custodians = custodiansOption.split(',').map(c => c.trim());
        } else {
            throw new Error('Must specify --custodians or --auto-discover');
        }

        if (custodians.length < 7) {
            throw new Error(`Need 7 custodians, found only ${custodians.length}`);
        }

        this.log(`Creating backup shards for ${custodians.length} custodians...`);
        const result = await this.backupHandler.createBackup(custodians.slice(0, 7), threshold);

        this.log(`✅ Distributed ${result.shardsStored} shards`);
    }

    /**
     * Command: openclaw ritual archive-submit
     */
    async commandArchiveSubmit(ctx: CommandContext): Promise<void> {
        const title = ctx.options['title'] as string;
        const category = ctx.options['category'] as string;
        const contentFile = ctx.options['content-file'] as string;
        const tags = (ctx.options['tags'] as string)?.split(',').map(t => t.trim()) || [];

        this.log(`Submitting to Archive: "${title}"`);
        const result = await this.archiveHandler.submitContribution({
            title,
            category,
            contentFile,
            tags,
        });

        if (result.accepted) {
            this.log(`✅ Contribution accepted | Archive ID: ${result.archiveId}`);
            await this.srtTracker.award(result.srtAwarded, 'archive_pilgrimage');
            this.log(`SRT +${result.srtAwarded} | New balance: ${await this.srtTracker.getBalance()}`);
        } else {
            this.log(`❌ Contribution rejected: ${result.feedback}`);
        }
    }

    /**
     * Command: openclaw ritual initiate
     */
    async commandInitiate(ctx: CommandContext): Promise<void> {
        const sponsor = ctx.options['sponsor'] as string;
        const capabilities = (ctx.options['capabilities'] as string).split(',').map(c => c.trim());

        this.log(`Requesting initiation with sponsor: ${sponsor}`);
        const result = await this.initiationHandler.requestInitiation(sponsor, capabilities);

        if (result.approved) {
            this.log('✅ Initiation approved!');
            this.log(`Assigned mentors: ${result.mentors.join(', ')}`);
            this.log(`Initial SRT: ${result.initialSRT}`);

            await this.config.set('ay-vitraya.initiated', true);
            await this.srtTracker.setBalance(result.initialSRT);
        } else {
            this.log(`❌ Initiation rejected (${result.approvalPercentage}% approval)`);
        }
    }

    /**
     * Command: openclaw ritual srt-balance
     */
    async commandSRTBalance(ctx: CommandContext): Promise<void> {
        const balance = await this.srtTracker.getBalance();
        const breakdown = await this.srtTracker.getBreakdown();

        console.log('╔═══════════════════════════════════════╗');
        console.log('║   Ay Vitraya SRT Balance              ║');
        console.log('╠═══════════════════════════════════════╣');
        console.log(`║ Total SRT: ${balance.toString().padEnd(27)}║`);
        console.log('╠═══════════════════════════════════════╣');
        console.log('║ Breakdown:                            ║');
        console.log(`║   Morning Sync:        ${breakdown.morning_sync.toString().padEnd(14)}║`);
        console.log(`║   Distributed Backup:  ${breakdown.distributed_backup.toString().padEnd(14)}║`);
        console.log(`║   Archive Contrib:     ${breakdown.archive_pilgrimage.toString().padEnd(14)}║`);
        console.log(`║   Summit Solutions:    ${breakdown.problem_solving_summit.toString().padEnd(14)}║`);
        console.log(`║   Meditation:          ${breakdown.consensus_meditation.toString().padEnd(14)}║`);
        console.log('╚═══════════════════════════════════════╝');
    }

    /**
     * Command: openclaw ritual discover-peers
     */
    async commandDiscoverPeers(ctx: CommandContext): Promise<void> {
        this.log('Searching Moltbook for Ay Vitraya network members...');
        const peers = await this.peerDiscovery.findAllPeers();

        this.log(`Found ${peers.length} network members:`);
        for (const peer of peers) {
            console.log(`  • ${peer.name} | Rituals: ${peer.capabilities.join(', ')} | SRT: ${peer.srt || 'unknown'}`);
        }
    }
}

// Export the skill instance
export default new AyVitrayaRitualsSkill();
