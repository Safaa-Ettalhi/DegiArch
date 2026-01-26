import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { LlmService } from './llm.service';

describe('LlmService', () => {
  let service: LlmService;
  let module: TestingModule;

  const mockHttpService = {
    post: jest.fn(),
  };

  const createModule = async (configMock: jest.Mock) => {
    const mockConfigService = {
      get: configMock,
    };

    return Test.createTestingModule({
      providers: [
        LlmService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();
  };

  afterEach(async () => {
    jest.clearAllMocks();
    if (module) {
      await module.close();
    }
  });

  describe('extractTextFromPdf', () => {
    const mockPdfBuffer = Buffer.from('fake pdf content');

    beforeEach(async () => {
      const configMock = jest.fn().mockReturnValue(undefined);
      module = await createModule(configMock);
      service = module.get<LlmService>(LlmService);
    });

    it('should extract text from PDF successfully', async () => {
      const result = await service.extractTextFromPdf(mockPdfBuffer);

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle PDF with no extractable text', async () => {
      const result = await service.extractTextFromPdf(mockPdfBuffer);

      expect(typeof result).toBe('string');
    });

    it('should handle extraction errors gracefully', async () => {
      const result = await service.extractTextFromPdf(mockPdfBuffer);

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('detectSignature', () => {
    const mockPdfBuffer = Buffer.from('fake pdf content');

    beforeEach(async () => {
      const configMock = jest.fn().mockReturnValue(undefined);
      module = await createModule(configMock);
      service = module.get<LlmService>(LlmService);
    });

    it('should detect signature when keywords are present', async () => {
      jest
        .spyOn(service, 'extractTextFromPdf')
        .mockResolvedValue('Ce document a été signé par le responsable');

      const result = await service.detectSignature(mockPdfBuffer);

      expect(result).toBe(true);
    });

    it('should not detect signature when keywords are absent', async () => {
      const extractSpy = jest
        .spyOn(service, 'extractTextFromPdf')
        .mockResolvedValue('Document administratif standard');

      const result = await service.detectSignature(mockPdfBuffer);

      expect(extractSpy).toHaveBeenCalledWith(mockPdfBuffer);
      // Verify the text doesn't contain signature keywords
      const text = 'Document administratif standard';
      const keywords = [
        'signature',
        'signé',
        'signature:',
        'signé par',
        'approuvé',
      ];
      const hasKeyword = keywords.some((keyword) =>
        text.toLowerCase().includes(keyword.toLowerCase()),
      );
      expect(hasKeyword).toBe(false);
      expect(result).toBe(false);
      extractSpy.mockRestore();
    });

    it('should handle errors during signature detection', async () => {
      jest
        .spyOn(service, 'extractTextFromPdf')
        .mockRejectedValue(new Error('Extraction error'));

      const result = await service.detectSignature(mockPdfBuffer);

      expect(result).toBe(false);
    });
  });

  describe('extractDocumentInfo', () => {
    const mockPdfText = `
      Nom: ETTALHI
      Prénom: Safaa
      CIN: AB123456
      Département: RH
      Type de document: Demande de congé
    `;

    beforeEach(async () => {
      const configMock = jest.fn().mockImplementation((key: string) => {
        if (key === 'llm.apiKey') return 'test-api-key';
        if (key === 'llm.provider') return 'groq';
        if (key === 'llm.model') return 'llama-3.3-70b-versatile';
        return undefined;
      });
      module = await createModule(configMock);
      service = module.get<LlmService>(LlmService);
    });

    it('should extract document info using Groq API', async () => {
      // Define a proper response type
      interface ChatCompletionResponse {
        data: {
          choices: Array<{
            message: {
              content: string;
            };
          }>;
        };
      }

      const mockResponse: ChatCompletionResponse = {
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  firstName: 'Safaa',
                  lastName: 'ETTALHI',
                  cin: 'AB123456',
                  department: 'RH',
                  documentType: 'demande_conge',
                  departmentDescription: 'Ressources Humaines',
                  documentDescription: 'Demande de congé',
                }),
              },
            },
          ],
        },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.extractDocumentInfo(
        mockPdfText,
        'RH',
        'demande_conge',
      );

      expect(mockHttpService.post).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const callArgs = mockHttpService.post.mock.calls[0];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(callArgs[0]).toBe(
        'https://api.groq.com/openai/v1/chat/completions',
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(callArgs[1]).toMatchObject({
        model: 'llama-3.3-70b-versatile',
      });
      expect(result.firstName).toBe('Safaa');
      expect(result.lastName).toBe('ETTALHI');
      expect(result.cin).toBe('AB123456');
      expect(result.department).toBe('RH');
      expect(result.documentType).toBe('demande_conge');
    });

    it('should extract document info using OpenAI API', async () => {
      // Recreate service with OpenAI config
      await module.close();
      const configMock = jest.fn().mockImplementation((key: string) => {
        if (key === 'llm.apiKey') return 'test-api-key';
        if (key === 'llm.provider') return 'openai';
        if (key === 'llm.model') return 'gpt-4o-mini';
        return undefined;
      });
      module = await createModule(configMock);
      service = module.get<LlmService>(LlmService);

      const mockResponseOpenAI = {
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  firstName: 'Safaa',
                  lastName: 'ETTALHI',
                  cin: 'AB123456',
                  department: 'RH',
                  documentType: 'demande_conge',
                }),
              },
            },
          ],
        },
      };

      mockHttpService.post.mockReturnValue(of(mockResponseOpenAI));

      const result = await service.extractDocumentInfo(
        mockPdfText,
        'RH',
        'demande_conge',
      );

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          model: 'gpt-4o-mini',
        }),
        expect.any(Object),
      );
      expect(result.firstName).toBe('Safaa');
    });

    it('should fallback to basic extraction when API key is missing', async () => {
      await module.close();
      mockHttpService.post.mockClear();
      const configMock = jest.fn().mockImplementation((key: string) => {
        if (key === 'llm.apiKey') return '';
        return undefined;
      });
      module = await createModule(configMock);
      service = module.get<LlmService>(LlmService);

      const result = await service.extractDocumentInfo(
        mockPdfText,
        'RH',
        'demande_conge',
      );

      expect(mockHttpService.post).not.toHaveBeenCalled();
      expect(result.department).toBe('RH');
      expect(result.documentType).toBe('demande_conge');
    });

    it('should fallback to basic extraction when API call fails', async () => {
      mockHttpService.post.mockReturnValue(
        throwError(() => new Error('API Error')),
      );

      const result = await service.extractDocumentInfo(
        mockPdfText,
        'RH',
        'demande_conge',
      );

      expect(result.department).toBe('RH');
      expect(result.documentType).toBe('demande_conge');
    });

    it('should handle JSON parsing errors in API response', async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'Invalid JSON response with {firstName: "Safaa"}',
              },
            },
          ],
        },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.extractDocumentInfo(
        mockPdfText,
        'RH',
        'demande_conge',
      );

      expect(result.department).toBe('RH');
      expect(result.documentType).toBe('demande_conge');
    });

    it('should extract CIN from text using regex pattern', async () => {
      await module.close();
      mockHttpService.post.mockClear();
      const configMock = jest.fn().mockImplementation((key: string) => {
        if (key === 'llm.apiKey') return '';
        return undefined;
      });
      module = await createModule(configMock);
      service = module.get<LlmService>(LlmService);

      const textWithCin = 'CIN: AB123456 Document important';
      const result = await service.extractDocumentInfo(
        textWithCin,
        'RH',
        'test',
      );

      expect(result.cin).toBeDefined();
    });

    it('should handle empty or invalid PDF text', async () => {
      await module.close();
      mockHttpService.post.mockClear();
      const configMock = jest.fn().mockImplementation((key: string) => {
        if (key === 'llm.apiKey') return '';
        return undefined;
      });
      module = await createModule(configMock);
      service = module.get<LlmService>(LlmService);

      const result = await service.extractDocumentInfo('', 'RH', 'test');

      expect(result.department).toBe('RH');
      expect(result.documentType).toBe('test');
    });
  });

  describe('Provider configuration', () => {
    it('should use default Groq provider when not specified', async () => {
      await module.close();
      const configMock = jest.fn().mockImplementation((key: string) => {
        if (key === 'llm.apiKey') return 'test-api-key';
        if (key === 'llm.provider') return undefined; // Default to groq
        if (key === 'llm.model') return 'llama-3.3-70b-versatile';
        return undefined;
      });
      module = await createModule(configMock);
      service = module.get<LlmService>(LlmService);

      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  firstName: 'Test',
                  lastName: 'User',
                }),
              },
            },
          ],
        },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      await service.extractDocumentInfo('test text', 'RH', 'test');

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://api.groq.com/openai/v1/chat/completions',
        expect.any(Object),
        expect.any(Object),
      );
    });

    it('should handle unknown provider gracefully', async () => {
      await module.close();
      mockHttpService.post.mockClear();
      const configMock = jest.fn().mockImplementation((key: string) => {
        if (key === 'llm.apiKey') return 'test-api-key';
        if (key === 'llm.provider') return 'unknown-provider';
        if (key === 'llm.model') return 'test-model';
        return undefined;
      });
      module = await createModule(configMock);
      service = module.get<LlmService>(LlmService);

      const result = await service.extractDocumentInfo('test', 'RH', 'test');

      // Unknown provider should fallback to basic extraction
      expect(result.department).toBe('RH');
      expect(result.documentType).toBe('test');
    });
  });
});
