
export function getProductPrice(product: {
  priceCents: number;
  discountValue?: number | null;
  discountType?: "PERCENTAGE" | "FIXED" | null;
}) {
  const originalPrice = product.priceCents;
  const discountValue = product.discountValue ?? null;
  const discountType = product.discountType ?? null;

  if (discountValue == null || discountValue <= 0 || !discountType) {
    return { price: originalPrice, originalPrice, hasDiscount: false, discountPercentage: 0 };
  }

  if (discountType === "FIXED") {
    const discountCents = Math.round(discountValue * 100);
    const price = Math.max(0, originalPrice - discountCents);
    const hasDiscount = price < originalPrice;
    const discountPercentage =
      hasDiscount && originalPrice > 0 ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
    return { price, originalPrice, hasDiscount, discountPercentage };
  }

  const pct = Math.max(0, Math.min(90, discountValue));
  const discountCents = Math.round((originalPrice * pct) / 100);
  const price = Math.max(0, originalPrice - discountCents);
  const hasDiscount = price < originalPrice;
  const discountPercentage = hasDiscount ? pct : 0;
  return { price, originalPrice, hasDiscount, discountPercentage };
}
