/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface ExtractedData {
  firstName?: string;
  lastName?: string;
  cin?: string;
  department?: string;
  documentType?: string;
  signatureDetected?: boolean;
  departmentDescription?: string;
  documentDescription?: string;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly apiKey: string;
  private readonly provider: string;
  private readonly model: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.apiKey = this.configService.get<string>('llm.apiKey') || '';
    this.provider = this.configService.get<string>('llm.provider') || 'groq';
    this.model =
      this.configService.get<string>('llm.model') || 'llama-3.3-70b-versatile';
  }

  async extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
    try {
      const pdfParseModule = await import('pdf-parse');
      const PDFParse = pdfParseModule.PDFParse;

      if (!PDFParse || typeof PDFParse !== 'function') {
        throw new Error('PDFParse class not found in pdf-parse module');
      }
      const uint8Array = new Uint8Array(pdfBuffer);
      const parser = new PDFParse({ data: uint8Array });

      const result = parser.getText();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const extractedText = (await result).text || '';

      if (!extractedText || extractedText.trim().length === 0) {
        this.logger.warn(
          'Aucun texte extrait du PDF - le document est peut-être scanné (image)',
        );
        return 'Document PDF scanné - Contenu image nécessitant OCR pour extraction complète';
      }

      this.logger.log(
        `Texte extrait du PDF: ${extractedText.length} caractères`,
      );
      return extractedText;
    } catch (error: any) {
      this.logger.error(
        "Erreur lors de l'extraction du texte PDF",
        (error as Error)?.message || error,
      );
      return "Erreur lors de l'extraction du texte - traitement avec informations limitées";
    }
  }

  async detectSignature(pdfBuffer: Buffer): Promise<boolean> {
    try {
      const text = await this.extractTextFromPdf(pdfBuffer);
      const signatureKeywords = [
        'signature',
        'signé',
        'signature:',
        'signé par',
        'approuvé',
      ];
      const hasSignature = signatureKeywords.some((keyword) =>
        text.toLowerCase().includes(keyword.toLowerCase()),
      );

      return hasSignature;
    } catch (error) {
      this.logger.error('Erreur lors de la détection de signature', error);
      return false;
    }
  }

  async extractDocumentInfo(
    pdfText: string,
    providedDepartment?: string,
    providedDocumentType?: string,
  ): Promise<ExtractedData> {
    if (!this.apiKey) {
      this.logger.warn('LLM_API_KEY non configurée - extraction limitée');
      return this.extractBasicInfo(
        pdfText,
        providedDepartment,
        providedDocumentType,
      );
    }

    try {
      const prompt = this.buildExtractionPrompt(
        pdfText,
        providedDepartment,
        providedDocumentType,
      );
      this.logger.log(
        `[LLM] Utilisation du provider: ${this.provider}, modèle: ${this.model}`,
      );

      if (this.provider === 'openai') {
        this.logger.log("[LLM] Appel de l'API OpenAI...");
        return await this.callOpenAI(prompt);
      } else if (this.provider === 'groq') {
        this.logger.log("[LLM] Appel de l'API Groq...");
        return await this.callGroq(prompt);
      } else {
        this.logger.warn(
          `[LLM] Provider ${this.provider} non implémenté, utilisation de l'extraction basique`,
        );
        return this.extractBasicInfo(
          pdfText,
          providedDepartment,
          providedDocumentType,
        );
      }
    } catch (error) {
      this.logger.error("[LLM] Erreur lors de l'extraction LLM", error);
      this.logger.warn('[LLM] Fallback sur extraction basique...');
      return this.extractBasicInfo(
        pdfText,
        providedDepartment,
        providedDocumentType,
      );
    }
  }

  private buildExtractionPrompt(
    pdfText: string,
    providedDepartment?: string,
    providedDocumentType?: string,
  ): string {
    return `Tu es un expert en extraction d'informations de documents administratifs marocains.

Analyse le texte suivant d'un document PDF scanné et extrais les informations suivantes au format JSON strict :

{
  "firstName": "prénom de la personne",
  "lastName": "nom de la personne",
  "cin": "numéro CIN (Carte d'Identité Nationale) si présent",
  "department": "département responsable (${providedDepartment || 'à déterminer'})",
  "documentType": "type de document (${providedDocumentType || 'à déterminer'})",
  "departmentDescription": "description du département",
  "documentDescription": "description du contenu du document"
}

Règles importantes :
- Si le CIN n'est pas trouvé, laisse "cin" vide ou null
- Le département peut être : RH, Finance, IT, Direction, etc.
- Le type de document peut être : demande_conge, certificat_travail, fiche_paie, etc.
- Retourne UNIQUEMENT le JSON, sans texte supplémentaire
- Si une information n'est pas trouvée, utilise null ou une chaîne vide

Texte du document :
${pdfText.substring(0, 3000)}`;
  }
  private async callOpenAI(prompt: string): Promise<ExtractedData> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: this.model,
            messages: [
              {
                role: 'system',
                content:
                  "Tu es un expert en extraction d'informations de documents administratifs. Tu réponds uniquement en JSON valide.",
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.3,
            max_tokens: 500,
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const data = response.data as {
        choices: { message: { content: string } }[];
      };
      const content = data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Réponse LLM vide');
      }

      const extracted = JSON.parse(content) as ExtractedData;

      return {
        firstName: extracted.firstName || undefined,
        lastName: extracted.lastName || undefined,
        cin: extracted.cin || undefined,
        department: extracted.department || undefined,
        documentType: extracted.documentType || undefined,
        departmentDescription: extracted.departmentDescription || undefined,
        documentDescription: extracted.documentDescription || undefined,
      };
    } catch (error: any) {
      this.logger.error(
        'Erreur appel OpenAI',
        error.response?.data || (error as Error).message,
      );
      throw error;
    }
  }

  private async callGroq(prompt: string): Promise<ExtractedData> {
    try {
      const groqModel = this.model || 'llama-3.1-70b-versatile';
      this.logger.log(
        `[Groq] Envoi de la requête avec le modèle: ${groqModel}`,
      );

      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: groqModel,
            messages: [
              {
                role: 'system',
                content:
                  "Tu es un expert en extraction d'informations de documents administratifs marocains. Tu réponds uniquement en JSON valide, sans texte supplémentaire.",
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.3,
            max_tokens: 500,
            response_format: { type: 'json_object' },
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const data = response.data as {
        choices: { message: { content: string } }[];
      };
      const content = data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Réponse Groq vide');
      }

      this.logger.log(`[Groq] Réponse reçue: ${content.substring(0, 200)}...`);

      let extracted: ExtractedData;
      try {
        extracted = JSON.parse(content) as ExtractedData;
        this.logger.log('[Groq] JSON parsé avec succès');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_) {
        this.logger.warn(
          "[Groq] Erreur de parsing JSON, tentative d'extraction...",
        );
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extracted = JSON.parse(jsonMatch[0]) as ExtractedData;
          this.logger.log('[Groq] JSON extrait et parsé avec succès');
        } else {
          throw new Error('Impossible de parser le JSON de la réponse');
        }
      }

      this.logger.log(
        `[Groq] Données extraites: ${JSON.stringify(extracted, null, 2)}`,
      );
      return {
        firstName: extracted.firstName || undefined,
        lastName: extracted.lastName || undefined,
        cin: extracted.cin || undefined,
        department: extracted.department || undefined,
        documentType: extracted.documentType || undefined,
        departmentDescription: extracted.departmentDescription || undefined,
        documentDescription: extracted.documentDescription || undefined,
      };
    } catch (error: any) {
      this.logger.error(
        'Erreur appel Groq',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        error.response?.data || (error as Error).message,
      );
      throw error;
    }
  }

  private extractBasicInfo(
    pdfText: string,
    providedDepartment?: string,
    providedDocumentType?: string,
  ): ExtractedData {
    const cinPattern = /\b[A-Z]{1,2}\d{5,8}\b/g;
    const cinMatch = pdfText.match(cinPattern);

    const namePatterns = [
      /nom[:\s]+([A-Z][a-z]+)/i,
      /prénom[:\s]+([A-Z][a-z]+)/i,
      /([A-Z][a-z]+\s+[A-Z][a-z]+)/,
    ];

    let firstName: string | undefined;
    let lastName: string | undefined;

    for (const pattern of namePatterns) {
      const match = pdfText.match(pattern);
      if (match) {
        const names = match[1]?.split(/\s+/);
        if (names && names.length >= 2) {
          firstName = names[0];
          lastName = names.slice(1).join(' ');
          break;
        }
      }
    }

    return {
      firstName,
      lastName,
      cin: cinMatch ? cinMatch[0] : undefined,
      department: providedDepartment,
      documentType: providedDocumentType,
      departmentDescription: providedDepartment
        ? `Département ${providedDepartment}`
        : undefined,
      documentDescription: providedDocumentType
        ? `Document de type ${providedDocumentType}`
        : undefined,
    };
  }
}
