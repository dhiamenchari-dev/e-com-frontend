export type Category = {
  id: string;
  name: string;
};

export type ProductImage = {
  url: string;
  publicId?: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  stock: number;
  images: ProductImage[];
  category: Category;
  shippingCents?: number | null;
  discountValue?: number | null;
  discountType?: "PERCENTAGE" | "FIXED" | null;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
};

