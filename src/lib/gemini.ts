import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ValidationResult {
  isValid: boolean;
  documentType: string;
  foundCode: string | null;
  referenceDate: string | null;
  isFromEcac: boolean;
  hasPaymentProof: boolean;
  explanation: string;
  requirementsMet: {
    type: boolean;
    code: boolean;
    date: boolean;
    origin: boolean;
    payment: boolean;
  };
}

export async function analyzePdf(base64Data: string): Promise<ValidationResult> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `Analise este documento PDF e verifique se ele atende aos requisitos fiscais.
  
  REQUISITOS:
  1. Tipo de Documento: Deve ser Comprovante ECD, DAS ou DARF.
  2. Códigos DARF Válidos: 2089, 0220, 3373, 5993, 2362, 2172, 2372, 6012, 2484, 2469, 5856, 6912, 7987, 8109.
  3. Período: Últimos 3 meses (Fevereiro, Março ou Abril de 2026). O mês atual é Maio de 2026.
  4. Origem: Emitido pelo sistema e-CAC da Receita Federal.
  5. Pagamento: Deve conter o comprovante de pagamento.

  Responda estritamente em JSON seguindo este esquema:
  {
    "isValid": boolean,
    "documentType": string (ex: "DARF", "DAS", "ECD", "Desconhecido"),
    "foundCode": string or null (se for DARF),
    "referenceDate": string or null (Período de Apuração ou Referência),
    "isFromEcac": boolean,
    "hasPaymentProof": boolean,
    "explanation": string (explicação detalhada do porquê atende ou não),
    "requirementsMet": {
      "type": boolean,
      "code": boolean,
      "date": boolean,
      "origin": boolean,
      "payment": boolean
    }
  }`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "application/pdf",
                data: base64Data,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["isValid", "documentType", "foundCode", "referenceDate", "isFromEcac", "hasPaymentProof", "explanation", "requirementsMet"],
          properties: {
            isValid: { type: Type.BOOLEAN },
            documentType: { type: Type.STRING },
            foundCode: { type: Type.STRING, nullable: true },
            referenceDate: { type: Type.STRING, nullable: true },
            isFromEcac: { type: Type.BOOLEAN },
            hasPaymentProof: { type: Type.BOOLEAN },
            explanation: { type: Type.STRING },
            requirementsMet: {
              type: Type.OBJECT,
              required: ["type", "code", "date", "origin", "payment"],
              properties: {
                type: { type: Type.BOOLEAN },
                code: { type: Type.BOOLEAN },
                date: { type: Type.BOOLEAN },
                origin: { type: Type.BOOLEAN },
                payment: { type: Type.BOOLEAN },
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Erro ao analisar o documento com IA.");
  }
}
