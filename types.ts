
export enum UserRole {
  BUYER = 'buyer',
  SELLER = 'seller',
  ADMIN = 'admin'
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_verified?: boolean;
}

export interface RFQ {
  id: number;
  buyer_id: number;
  product: string;
  quantity: number;
  specs: string;
  category: string; // New: For Alibaba-style filtering
  image_url?: string;
  created_at?: string;
  status?: 'open' | 'closed' | 'awarded';
  urgency?: 'normal' | 'high' | 'critical';
}

export interface Quote {
  id: number;
  rfq_id: number;
  seller_id: number;
  price: number;
  seller_name?: string;
  product_name?: string;
  created_at?: string;
  is_gold_supplier?: boolean; // New: Trust badge
}

export interface Message {
  id: number;
  rfq_id: number;
  sender_id: number;
  sender_name?: string;
  message: string;
  created_at?: string;
}

export interface Escrow {
  id: number;
  rfq_id: number;
  amount: number;
  status: 'pending' | 'funded' | 'released' | 'disputed';
}

export interface AuthResponse {
  token: string;
  user: User;
}
