"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "../../../../components/AdminShell";
import { Button } from "../../../../components/Button";
import { useAuth } from "../../../../lib/auth";
import { formatMoney } from "../../../../lib/money";
import { getErrorMessage } from "../../../../lib/api";

type OrderDetail = {
  id: string;
  status: string;
  totalCents: number;
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
  currency: string;
  createdAt: string;
  user: { id: string; email: string; name: string } | null;
  shipping: {
    fullName: string;
    phone: string;
    addressLine1: string;
    city: string;
    notes?: string;
    email?: string;
  } | null;
  items: {
    id: string;
    productId: string;
    name: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }[];
};

export default function OrderDetailPage() {
  const { id } = useParams() as { id: string };
  const { authedFetch } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await authedFetch<{ order: OrderDetail }>(`/api/admin/orders/${id}`);
        setOrder(data.order);
      } catch (e) {
        setError(getErrorMessage(e, "Failed to load order"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, authedFetch]);

  if (loading) return <AdminShell title="Détails de la commande">Chargement...</AdminShell>;
  if (error) return <AdminShell title="Détails de la commande"><div className="text-red-600">{error}</div></AdminShell>;
  if (!order) return <AdminShell title="Détails de la commande">Introuvable</AdminShell>;

  return (
    <AdminShell title={`Commande ${order.id}`}>
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Button variant="secondary" onClick={() => router.back()}>
          &larr; Retour aux commandes
        </Button>
        <Button onClick={() => window.print()}>
          Imprimer le reçu
        </Button>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-8 print:border-0 print:p-0 print:shadow-none">
        {/* Print Header */}
        <div className="mb-8 border-b border-zinc-200 pb-6 print:border-zinc-300">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">FACTURE</h1>
              <p className="mt-1 text-sm text-zinc-500">N° {order.id}</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-zinc-900">Ecom Store</div>
              <div className="text-sm text-zinc-500">Date : {new Date(order.createdAt).toLocaleDateString("fr-FR")}</div>
              <div className="text-sm text-zinc-500">Statut : <span className="uppercase font-semibold">{order.status}</span></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 mb-2 uppercase tracking-wider">Facturé à</h3>
            <div className="text-sm text-zinc-600">
              <div className="font-medium text-zinc-900">{order.shipping?.fullName || order.user?.name || "Invité"}</div>
              {order.shipping?.addressLine1 && <div>{order.shipping.addressLine1}</div>}
              {order.shipping?.city && <div>{order.shipping.city}</div>}
              {order.shipping?.phone && <div>Tél : {order.shipping.phone}</div>}
              {(order.shipping?.email || order.user?.email) && <div>E-mail : {order.shipping?.email || order.user?.email}</div>}
            </div>
          </div>
          {order.shipping?.notes && (
             <div>
               <h3 className="text-sm font-semibold text-zinc-900 mb-2 uppercase tracking-wider">Notes</h3>
               <div className="text-sm text-zinc-600 bg-zinc-50 p-3 rounded-lg print:bg-transparent print:p-0">
                 {order.shipping.notes}
               </div>
             </div>
          )}
        </div>

        <table className="w-full mb-8">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs font-semibold uppercase text-zinc-500 tracking-wider">
              <th className="pb-3">Article</th>
              <th className="pb-3 text-right">Prix</th>
              <th className="pb-3 text-right">Qté</th>
              <th className="pb-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {order.items.map((item) => (
              <tr key={item.id} className="text-sm">
                <td className="py-3 text-zinc-900">{item.name}</td>
                <td className="py-3 text-right text-zinc-600">{formatMoney(item.unitPriceCents, order.currency)}</td>
                <td className="py-3 text-right text-zinc-600">{item.quantity}</td>
                <td className="py-3 text-right font-medium text-zinc-900">{formatMoney(item.lineTotalCents, order.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm text-zinc-600">
              <span>Sous-total</span>
              <span>{formatMoney(order.subtotalCents, order.currency)}</span>
            </div>
            <div className="flex justify-between text-sm text-zinc-600">
              <span>Livraison</span>
              <span>{formatMoney(order.shippingCents, order.currency)}</span>
            </div>
            {order.discountCents > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Remise</span>
                <span>-{formatMoney(order.discountCents, order.currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-zinc-900 border-t border-zinc-200 pt-2">
              <span>Total</span>
              <span>{formatMoney(order.totalCents, order.currency)}</span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-200 text-center text-xs text-zinc-500 print:block hidden">
          <p>Merci pour votre confiance !</p>
        </div>
      </div>
    </AdminShell>
  );
}
