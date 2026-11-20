import { ChatbotGateway } from './chatbot.gateway';
import { Socket } from 'socket.io';

const buildClient = (auth: Record<string, unknown>): Socket =>
    ({
        handshake: { auth },
        data: {},
        id: 'socket-1',
        disconnect: jest.fn(),
        emit: jest.fn(),
    }) as unknown as Socket;

describe('ChatbotGateway connection authentication', () => {
    const aiService = {} as never;
    const jwtService = { verify: jest.fn() };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('rejects sockets without a token', async () => {
        const gateway = new ChatbotGateway(aiService, jwtService as never);
        const client = buildClient({});

        await gateway.handleConnection(client);

        expect(client.disconnect).toHaveBeenCalled();
    });

    it('rejects sockets with an invalid token', async () => {
        jwtService.verify.mockImplementation(() => {
            throw new Error('jwt malformed');
        });
        const gateway = new ChatbotGateway(aiService, jwtService as never);
        const client = buildClient({ token: 'invalid-token' });

        await gateway.handleConnection(client);

        expect(client.disconnect).toHaveBeenCalled();
    });

    it('accepts a valid token and records the user on the socket', async () => {
        jwtService.verify.mockReturnValue({ sub: 'user-1', role: 'RECEPTIONIST' });
        const gateway = new ChatbotGateway(aiService, jwtService as never);
        const client = buildClient({ token: 'valid-token' });

        await gateway.handleConnection(client);

        expect(client.disconnect).not.toHaveBeenCalled();
        expect((client.data as { userId?: string }).userId).toBe('user-1');
    });
});
