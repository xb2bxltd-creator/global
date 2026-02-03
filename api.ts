
import { AuthResponse, User, RFQ, Quote, Message, Escrow } from './types';
import { GoogleGenAI } from "@google/genai";

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';

// Gemini AI Initialization
// Always use process.env.API_KEY directly for initialization.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `Request failed with status ${response.status}`);
  }
  return response.json();
}

export const authApi = {
  login: (credentials: any) => request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (data: any) => request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
};

export const rfqApi = {
  getAll: () => request<RFQ[]>('/rfq'),
  create: (rfq: Partial<RFQ>) => request<RFQ>('/rfq', { method: 'POST', body: JSON.stringify(rfq) }),
  getById: (id: number) => request<RFQ>(`/rfq/${id}`),
};

export const quoteApi = {
  getByRfq: (rfqId: number) => request<Quote[]>(`/quote/rfq/${rfqId}`),
  create: (quote: Partial<Quote>) => request<Quote>('/quote', { method: 'POST', body: JSON.stringify(quote) }),
  getSellerQuotes: () => request<Quote[]>('/quote/seller'),
};

export const chatApi = {
  getMessages: (rfqId: number) => request<Message[]>(`/chat/${rfqId}`),
  sendMessage: (rfqId: number, message: string) => 
    request<Message>('/chat', { method: 'POST', body: JSON.stringify({ rfq_id: rfqId, message }) }),
};

export const escrowApi = {
  getForRfq: (rfqId: number) => request<Escrow>(`/escrow/rfq/${rfqId}`),
  create: (data: Partial<Escrow>) => request<Escrow>('/escrow', { method: 'POST', body: JSON.stringify(data) }),
  release: (escrowId: number) => request<any>(`/escrow/release/${escrowId}`, { method: 'POST' }),
};

export const uploadApi = {
  uploadImage: async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
};

// --- GEMINI AI SERVICES (B2B INTELLIGENCE LAYER) ---
export interface ResearchResult {
  text: string;
  sources: { title?: string; uri?: string }[];
}

export const geminiApi = {
  // Deep Market Research with Web Grounding
  researchProduct: async (query: string): Promise<ResearchResult> => {
    // Correct usage of `ai.models.generateContent` with gemini-3-pro-preview.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Perform professional B2B market research for: "${query}". 
      Analyze: 1. Current global price trends. 2. Key manufacturing regions. 3. Major supply chain risks for 2024-2025.`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are the XB2BX Market Intelligence Agent. Provide high-density, technical trade analysis. Use Markdown."
      }
    });

    // Extracting grounding metadata sources as per requirements for googleSearch tool.
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map(chunk => ({
        title: chunk.web?.title,
        uri: chunk.web?.uri
      })).filter(s => s.uri) || [];

    // response.text is a getter property.
    return {
      text: response.text || "Intelligence feed unavailable.",
      sources
    };
  },

  generateSpecs: async (productName: string): Promise<string> => {
    // Changed model from 'gemini-2.5-flash-lite-latest' to compliant 'gemini-3-flash-preview' for basic text tasks.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a professional, technical B2B specification list for: "${productName}". Include materials, grade, and compliance certifications.`,
      config: { systemInstruction: "You are an elite procurement officer. Be concise and technical." }
    });
    return response.text || '';
  },

  generateProductImage: async (productName: string): Promise<string> => {
    // Using gemini-2.5-flash-image for standard image generation tasks.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A professional, high-quality, studio-lit commercial product render of: ${productName}. Neutral grey background, industrial style, 4k resolution.` }]
      },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return imagePart?.inlineData ? `data:image/png;base64,${imagePart.inlineData.data}` : '';
  },

  getSmartMatches: async (userRole: string, interests: string[]): Promise<string[]> => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on a ${userRole} role and interests in ${interests.join(', ')}, suggest 4 specific trending trade keywords. Return as a comma-separated list only.`,
    });
    return (response.text || '').split(',').map(s => s.trim()).filter(s => s.length > 0);
  },

  getMarketInsights: async (userRole: string, rfqCount: number): Promise<string> => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Strategic insight for ${userRole} in B2B marketplace with ${rfqCount} active RFQs. Highlight one specific trend.`,
      config: { systemInstruction: "You are the XB2BX Strategic AI Advisor. Be sharp, professional, and insightful like a Bloomberg analyst." }
    });
    return response.text || '';
  },

  analyzeOpportunity: async (product: string, specs: string): Promise<string> => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze this trade opportunity: Product: ${product}. Specs: ${specs}. Provide a 3-point summary: Market Demand, Technical Difficulty, and Value Rating.`,
    });
    return response.text || '';
  }
};
