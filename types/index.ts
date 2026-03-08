export interface Product {
  id: string;
  name: string;
  brand?: string;
  image?: string;
  sku: string;
  barcode?: string;
  price: number;
  stock: number;
  category: string;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface Bill {
  id: string;
  items: CartItem[];
  total: number;
  tax: number;
  grandTotal: number;
  createdAt: string;
}
