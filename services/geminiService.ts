import { GoogleGenAI, Type } from "@google/genai";
import { TicketPriority, SubjectCode } from "../types";

// Safely get API key without crashing if process is undefined
const getApiKey = () => {
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      return process.env.API_KEY;
    }
  } catch (e) {
    return undefined;
  }
  return undefined;
};

const apiKey = getApiKey();
// Only instantiate if key exists to prevent errors, otherwise allow app to load without AI
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

interface AnalysisResult {
  priority: TicketPriority;
  subjectCode: SubjectCode;
  analystAction: string; // Summary of action/problem
  suggestedNextStep: string;
}

export const analyzeTicketContent = async (description: string, clientName: string): Promise<AnalysisResult> => {
  if (!ai) {
    console.warn("Gemini API Key missing");
    return {
      priority: TicketPriority.MEDIUM,
      subjectCode: SubjectCode.CODE_1200,
      analystAction: "Verificar relato (IA indisponível).",
      suggestedNextStep: "Investigação manual necessária."
    };
  }

  try {
    const prompt = `
      Analise o seguinte relato de um chamado técnico e extraia informações estruturadas.
      Cliente: ${clientName}
      Relato: ${description}
      
      1. Classifique a prioridade.
      2. Classifique o Assunto (Subject Code) escolhendo OBRIGATORIAMENTE um destes valores exatos:
         - "1100 - Codigo"
         - "1101 - Codigo de peças"
         - "1102 - Codigo de midia"
         - "1200 - Duvida técnica"
         - "1201 - Interpretação defeito"
         - "1202 - Testes perifericos"
         - "1203 - Sistema de ensinamento"
         - "1204 - Status sensores"
         - "1205 - Diag não carrega"
         - "1206 - Erro de HW"
         - "1207 - Duvida em configuração"
      
      3. Gere um texto curto para o campo "Ação Analista" resumindo o problema técnico identificado.
      4. Sugira um próximo passo imediato.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            priority: {
              type: Type.STRING,
              enum: [TicketPriority.LOW, TicketPriority.MEDIUM, TicketPriority.HIGH, TicketPriority.CRITICAL]
            },
            subjectCode: {
              type: Type.STRING,
              enum: Object.values(SubjectCode)
            },
            analystAction: { type: Type.STRING },
            suggestedNextStep: { type: Type.STRING }
          },
          required: ["priority", "subjectCode", "analystAction", "suggestedNextStep"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Error analyzing ticket:", error);
    // Fallback defaults
    return {
      priority: TicketPriority.MEDIUM,
      subjectCode: SubjectCode.CODE_1200,
      analystAction: "Verificar relato.",
      suggestedNextStep: "Investigação manual necessária."
    };
  }
};