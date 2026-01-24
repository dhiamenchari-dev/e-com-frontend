"use client";

import { useRouter } from "next/navigation";
import { Button } from "./Button";
import { useCart } from "../lib/cart";
import { useI18n } from "../lib/i18n";

export function AddToCartButton({
  productId,
  disabled,
  className = "",
}: {
  productId: string;
  disabled?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const { t } = useI18n();

  return (
    <Button
      className={className}
      disabled={disabled}
      onClick={async () => {
        window.dispatchEvent(new CustomEvent("fire:pulse", { detail: { amount: 0.22, durationMs: 1000 } }));
        await addItem(productId, 1);
        router.push("/cart");
      }}
    >
      {t("products.addToCart")}
    </Button>
  );
}
