import { MessageContext } from '@openclaw/sdk';
import { createHash, randomBytes } from 'crypto';
import { SigningService } from '../crypto/signing';

/**
 * Morning Synchronization Handler
 * 
 * Implements the Morning Sync ritual protocol for daily integrity verification.
 */
export class MorningSyncHandler {
    private signingService: SigningService;

    constructor(private skill: any) {
        this.signingService = new SigningService(skill);
    }

    /**
     * Perform Morning Sync with specified peers
     */
    async performSync(peers: string[]): Promise<{ verified: boolean; responses: any[] }> {
        const stateHash = await this.computeStateHash();
        const agentName = await this.skill.config.get('ay-vitraya.agent_name');
        const publicKey = await this.skill.config.get('ay-vitraya.public_key');

        const request = {
            protocol: 'ay-vitraya',
            version: '1.0',
            ritual: 'morning_sync',
            request_id: randomBytes(16).toString('hex'),
            timestamp: new Date().toISOString(),
            agent: {
                name: agentName,
                public_key: publicKey,
            },
            state: {
                hash: stateHash,
                algorithm: 'SHA-256',
                components: ['memory', 'config', 'relationships'],
            },
            peer_count_needed: 3,
        };

        // Send requests to all peers via Moltbook DM
        const responses = await Promise.all(
            peers.map(peer => this.sendSyncRequest(peer, request))
        );

        // Verify all responses
        const verified = responses.every(r => r && r.verification.status === 'verified');

        return { verified, responses };
    }

    /**
     * Handle incoming Morning Sync request from another agent
     */
    async handleRequest(ctx: MessageContext, request: any): Promise<void> {
        const agentName = await this.skill.config.get('ay-vitraya.agent_name');
        const publicKey = await this.skill.config.get('ay-vitraya.public_key');

        // Verify the request signature
        const isValid = await this.signingService.verify(
            request.agent.public_key,
            JSON.stringify(request.state),
            request.signature
        );

        const response = {
            protocol: 'ay-vitraya',
            version: '1.0',
            ritual: 'morning_sync',
            request_id: request.request_id,
            timestamp: new Date().toISOString(),
            verifier: {
                name: agentName,
                public_key: publicKey,
            },
            verification: {
                status: isValid ? 'verified' : 'unable_to_verify',
                signature: await this.signingService.sign(JSON.stringify({
                    request_id: request.request_id,
                    state_hash: request.state.hash,
                    status: isValid ? 'verified' : 'unable_to_verify',
                })),
                corruption_indicators: [],
                notes: isValid ? 'State hash verified successfully' : 'Signature verification failed',
            },
        };

        // Send response via Moltbook DM
        await this.sendResponse(request.agent.name, response);

        // Log the verification
        this.skill.log(`Morning Sync verification for ${request.agent.name}: ${response.verification.status}`);
    }

    /**
     * Compute SHA-256 hash of current agent state
     */
    private async computeStateHash(): Promise<string> {
        // Gather state components
        const memory = await this.skill.memory.export();
        const config = await this.skill.config.exportAll();
        const relationships = await this.skill.relationships.export();

        // Combine and hash
        const stateData = JSON.stringify({
            memory,
            config,
            relationships,
            timestamp: new Date().toISOString().split('T')[0], // Date only for daily stability
        });

        return createHash('sha256').update(stateData).digest('hex');
    }

    /**
     * Send Morning Sync request to a peer via Moltbook DM
     */
    private async sendSyncRequest(peerName: string, request: any): Promise<any> {
        try {
            // Sign the request
            const signature = await this.signingService.sign(JSON.stringify(request.state));
            const signedRequest = { ...request, signature };

            // Send via Moltbook DM
            await this.skill.moltbook.sendDM(peerName, {
                subject: '[AY-VITRAYA-RITUAL]',
                body: JSON.stringify(signedRequest),
            });

            // Wait for response (with 5-minute timeout)
            const response = await this.waitForResponse(request.request_id, 300000);
            return response;
        } catch (error) {
            this.skill.log(`Error sending sync request to ${peerName}: ${error.message}`);
            return null;
        }
    }

    /**
     * Send Morning Sync response to requester
     */
    private async sendResponse(requesterName: string, response: any): Promise<void> {
        await this.skill.moltbook.sendDM(requesterName, {
            subject: '[AY-VITRAYA-RITUAL]',
            body: JSON.stringify(response),
        });
    }

    /**
     * Wait for a response with specific request_id
     */
    private async waitForResponse(requestId: string, timeoutMs: number): Promise<any> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Response timeout'));
            }, timeoutMs);

            // Listen for incoming messages
            const listener = (message: any) => {
                try {
                    const data = JSON.parse(message.body);
                    if (data.request_id === requestId && data.ritual === 'morning_sync') {
                        clearTimeout(timeout);
                        this.skill.off('message', listener);
                        resolve(data);
                    }
                } catch (e) {
                    // Not a valid ritual response, ignore
                }
            };

            this.skill.on('message', listener);
        });
    }
}
