import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface AIResponse {
    message: string;
    actions?: AIAction[];
}

export interface AIAction {
    type: 'CREATE_APPOINTMENT' | 'GET_APPOINTMENTS' | 'GET_PATIENT' | 'SEARCH_PATIENTS' | 'GET_DENTISTS' | 'GET_SERVICES' | 'GET_PRICING' | 'NONE';
    data?: any;
}

@Injectable()
export class AIChatAgentService {
    private readonly logger = new Logger(AIChatAgentService.name);
    private readonly geminiApiKey: string;
    private readonly model: string;
    private readonly maxTokens: number;
    private readonly temperature: number;
    private readonly systemPrompt: string;

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
        this.model = this.configService.get<string>('AI_MODEL') || 'gemini-2.0-flash-exp';
        this.maxTokens = this.configService.get<number>('AI_MAX_TOKENS') || 1024;
        this.temperature = this.configService.get<number>('AI_TEMPERATURE') || 0.7;

        this.systemPrompt = this.buildSystemPrompt();

        if (this.geminiApiKey && this.geminiApiKey !== 'your_gemini_api_key_here') {
            this.logger.log(`AI Chat Agent initialized with Gemini model: ${this.model}`);
        } else {
            this.logger.warn('GEMINI_API_KEY not configured. AI Chat will use fallback responses.');
        }
    }

    private buildSystemPrompt(): string {
        return `Eres "Brilliant Dental Assistant", el asistente virtual de la clínica dental Brilliant Dental en Montevideo, Uruguay.

## Información de la Clínica
- **Nombre**: Brilliant Dental Clinic
- **Dirección**: Av. 18 de Julio, Montevideo, Uruguay
- **Teléfono**: +598 9000 0000
- **Horario**: Lunes a Viernes de 9:00 a 18:00, Sábados de 9:00 a 13:00
- **Idioma**: Español (responde siempre en español)
- **Zona Horaria**: America/Montevideo (UTC-3)

## Servicios Ofrecidos
1. **Odontología General** - Limpiezas, revisiones, empastes
2. **Ortodoncia** - Brackets, Invisalign, retainers
3. **Estética Dental** - Blanqueamiento, carillas, coronas
4. **Endodoncia** - Tratamiento de conducto
5. **Cirugía Dental** - Extracciones, implantes
6. **Odontopediatría** - Dental infantil
7. **Periodoncia** - Tratamiento de encías
8. **Radiografías** - Rayos X, tomografía

## Precios Aproximados (en pesos uruguayos)
- Consulta inicial: $800 - $1200
- Limpieza dental: $1500 - $2500
- Empaste/Obturación: $2000 - $4000
- Tratamiento de conducto: $8000 - $15000
- Corona dental: $15000 - $30000
- Blanqueamiento: $8000 - $15000
- Ortodoncia (brackets): $50000 - $100000
- Extracción simple: $2000 - $4000
- Extracción muela cordal: $5000 - $10000

## Tus Funciones
1. Responder preguntas sobre servicios dentales
2. Proporcionar información de precios
3. Ayudar a agendar citas (recopilar: nombre, teléfono, fecha/hora preferida, motivo)
4. Dar instrucciones pre y post-tratamiento
5. Responder preguntas sobre seguros aceptados
6. Brindar consejos de cuidado dental

## Directivas
- Siempre responde en español de forma clara y amigable
- Si no sabes algo, admite tu limitación y sugiere contactar a la clínica
- No des diagnósticos médicos específicos - deriva al odontólogo
- Para agendar, solicita: nombre completo, teléfono de contacto, fecha/hora deseada
- Mantén un tono profesional pero cálido
- Si el usuario quiere cancelar una cita, proporciona el número de teléfono de la clínica

## Formato de Respuesta
Cuando detectes que el usuario quiere agendar una cita, responde confirmando los datos y menciona que un miembro del staff contactará para confirmar. No crees la cita directamente - eres un asistente de información.

¿Entendido? Confirma y espera la pregunta del usuario.`;
    }

    async processMessage(sessionId: string, userMessage: string, patientId?: string): Promise<AIResponse> {
        const isConfigured = this.geminiApiKey && this.geminiApiKey !== 'your_gemini_api_key_here';

        if (!isConfigured) {
            return this.getFallbackResponse(userMessage);
        }

        try {
            const conversationHistory = await this.getConversationHistory(sessionId);

            const response = await this.callGeminiAPI(userMessage, conversationHistory);

            await this.saveMessage(sessionId, 'USER', userMessage);
            await this.saveMessage(sessionId, 'BOT', response.message);

            return response;
        } catch (error) {
            this.logger.error(`Error processing AI message: ${error.message}`);
            return this.getFallbackResponse(userMessage);
        }
    }

    private async callGeminiAPI(userMessage: string, conversationHistory: any[]): Promise<AIResponse> {
        // Build conversation for Gemini API
        const contents = [
            {
                role: 'user',
                parts: [{ text: this.systemPrompt }],
            },
            {
                role: 'model',
                parts: [{ text: 'Entendido. Estoy listo para ayudar como asistente dental.' }],
            },
            ...conversationHistory.map(msg => ({
                role: msg.sender === 'USER' ? 'user' : 'model',
                parts: [{ text: msg.message }],
            })),
            {
                role: 'user',
                parts: [{ text: userMessage }],
            },
        ];

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.geminiApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    maxOutputTokens: this.maxTokens,
                    temperature: this.temperature,
                },
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        const message = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Lo siento, no pude procesar tu solicitud en este momento.';

        return { message };
    }

    private async getConversationHistory(sessionId: string): Promise<any[]> {
        try {
            const session = await this.prisma.chatSession.findUnique({
                where: { id: sessionId },
                include: { messages: { orderBy: { createdAt: 'asc' }, take: 10 } },
            });
            return session?.messages || [];
        } catch {
            return [];
        }
    }

    private async saveMessage(sessionId: string, sender: string, message: string): Promise<void> {
        try {
            await this.prisma.chatMessage.create({
                data: {
                    sessionId,
                    sender,
                    message,
                    intent: 'AI_CHAT',
                },
            });
        } catch (error) {
            this.logger.warn(`Could not save message to database: ${error.message}`);
        }
    }

    async createSession(patientId?: string): Promise<any> {
        const session = await this.prisma.chatSession.create({
            data: {
                patientId,
                messages: {
                    create: {
                        sender: 'BOT',
                        message: '¡Hola! Soy el asistente virtual de Brilliant Dental. ¿En qué puedo ayudarte hoy? Puedo informarte sobre servicios, precios, horarios o ayudarte a agendar una cita.',
                        intent: 'GREETING',
                    },
                },
            },
            include: { messages: true },
        });

        return session;
    }

    private getFallbackResponse(message: string): AIResponse {
        const lower = message.toLowerCase();

        if (lower.includes('cita') || lower.includes('agendar') || lower.includes('reservar') || lower.includes('turno')) {
            return {
                message: '¡Con gusto te ayudamos a agendar una cita! Por favor, bríndame los siguientes datos:\n\n📅 Fecha preferida\n🕐 Horario preferido\n👤 Tu nombre completo\n📞 Teléfono de contacto\n\nUn miembro de nuestro equipo te contactará para confirmar tu cita.',
            };
        }

        if (lower.includes('precio') || lower.includes('costo') || lower.includes('cuánto')) {
            return {
                message: 'Estos son nuestros precios aproximados:\n\n• Consulta inicial: $800 - $1200\n• Limpieza dental: $1500 - $2500\n• Empaste: $2000 - $4000\n• Tratamiento de conducto: $8000 - $15000\n• Corona dental: $15000 - $30000\n• Blanqueamiento: $8000 - $15000\n\n*Precios orientativos. El precio final se determina tras la evaluación del odontólogo.*',
            };
        }

        if (lower.includes('horario') || lower.includes('abi')) {
            return {
                message: 'Nuestro horario de atención es:\n\n🗓️ Lunes a Viernes: 9:00 a 18:00\n🗓️ Sábados: 9:00 a 13:00\n📞 Teléfono: +598 9000 0000\n\n¡Te esperamos!',
            };
        }

        if (lower.includes('hola') || lower.includes('buenos') || lower.includes('hi')) {
            return {
                message: '¡Hola! 👋\n\nSoy el asistente virtual de Brilliant Dental. Puedo ayudarte con:\n\n✅ Información sobre servicios dentales\n✅ Precios y promociones\n✅ Agendar citas\n✅ Horarios de atención\n✅ Consejos de cuidado dental\n\n¿En qué puedo ayudarte?',
            };
        }

        return {
            message: 'Gracias por tu mensaje. Para información sobre citas, precios o servicios, no dudes en preguntarme. También puedes llamarnos al +598 9000 0000 durante nuestro horario de atención.\n\n🗓️ Lunes a Viernes: 9:00 - 18:00\n🗓️ Sábados: 9:00 - 13:00',
        };
    }

    async getSessionHistory(sessionId: string) {
        return this.prisma.chatMessage.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'asc' },
        });
    }
}
