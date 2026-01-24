"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getFromStorage, setToStorage } from "./clientStorage";

export type Language = "en" | "fr";

type I18nContextValue = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string | number | undefined>) => string;
};

const LANG_KEY = "ecom_lang";

const translations = {
  en: {
    nav: {
      shop: "Shop",
      cart: "Cart",
      account: "Account",
      admin: "Admin",
      login: "Login",
      logout: "Logout",
      register: "Register",
      language: "Language",
    },
    pagination: {
      prev: "Prev",
      next: "Next",
      pageOf: "Page {page} / {totalPages}",
    },
    home: {
      heroTitle: "Shop modern essentials with fast delivery.",
      heroSubtitle:
        "Discover featured products, manage your cart, and place orders with cash on delivery.",
      browseProducts: "Browse products",
      viewCart: "View cart",
      featured: "Featured",
      featuredSubtitle: "Latest additions from our catalog.",
      viewAll: "View all",
      features: {
        fastDelivery: {
          title: "Fast delivery",
          desc: "We deliver your products as fast as possible.",
        },
        cod: {
          title: "Cash on delivery",
          desc: "Pay when your order arrives.",
        },
        support: {
          title: "24/7 support",
          desc: "We are here to help you anytime.",
        },
      },
    },
    products: {
      title: "Products",
      subtitle: "Browse products with category and price filters.",
      searchLabel: "Search",
      categoryLabel: "Category",
      minPriceLabel: "Min price",
      maxPriceLabel: "Max price",
      searchPlaceholder: "Search",
      allCategories: "All categories",
      minPricePlaceholder: "Min price",
      maxPricePlaceholder: "Max price",
      applyFilters: "Apply filters",
      loading: "Loading…",
      notFound: "Product not found.",
      noImage: "No image",
      inStock: "{count} in stock",
      outOfStock: "Out of stock",
      description: "Description",
      addToCart: "Add to cart",
    },
    cart: {
      title: "Cart",
      subtitle: "Review items and proceed to checkout.",
      continueShopping: "Continue shopping",
      empty: "Your cart is empty.",
      loading: "Loading…",
      noImage: "No image",
      productInactive: "Product inactive",
      remove: "Remove",
      summary: "Summary",
      subtotal: "Subtotal",
      shipping: "Shipping",
      discount: "Discount",
      total: "Total",
      checkout: "Checkout",
      paymentHint: "Payment method: Cash on delivery (COD).",
    },
    checkout: {
      title: "Checkout",
      subtitle: "Cash on delivery (payment at home).",
      empty: "Your cart is empty.",
      fullName: "Full name",
      emailOptional: "Email (optional)",
      phone: "Phone",
      address1: "Address line 1",
      address2: "Address line 2 (optional)",
      city: "City",
      postalCode: "Postal code",
      notesOptional: "Notes (optional)",
      placeOrder: "Place order",
      placingOrder: "Placing order…",
      orderSummary: "Order summary",
    },
    auth: {
      loginTitle: "Login",
      loginSubtitle: "Welcome back.",
      registerTitle: "Create account",
      registerSubtitle: "Start shopping in minutes.",
      email: "Email",
      password: "Password",
      name: "Name",
      signingIn: "Signing in…",
      creating: "Creating…",
      noAccount: "No account?",
      haveAccount: "Have an account?",
    },
    account: {
      title: "Account",
      profile: "Profile",
      name: "Name",
      role: "Role",
      security: "Security",
      newEmail: "New email",
      updateEmail: "Update email",
      emailUpdated: "Email updated.",
      emailNoChange: "Please enter a different email.",
      currentPassword: "Current password",
      newPassword: "New password",
      confirmNewPassword: "Confirm new password",
      updatePassword: "Update password",
      passwordUpdated: "Password updated.",
      passwordRequired: "Please enter a new password.",
      passwordTooShort: "Password must be at least 8 characters.",
      passwordMismatch: "Passwords do not match.",
      saving: "Saving…",
      updateFailed: "Update failed.",
      orderHistory: "Order history",
      noOrders: "No orders yet.",
      view: "View",
      order: "Order {id}",
    },
    order: {
      title: "Order",
      orderId: "Order ID: {id}",
      items: "Items",
      summary: "Summary",
      status: "Status",
      payment: "Payment",
      subtotal: "Subtotal",
      discount: "Discount",
      shipping: "Shipping",
      total: "Total",
      loading: "Loading…",
      backToAccount: "Back to account",
    },
    misc: {
      footer: "© {year} Ecom",
      loading: "Loading…",
    },
  },
  fr: {
    nav: {
      shop: "Boutique",
      cart: "Panier",
      account: "Compte",
      admin: "Admin",
      login: "Connexion",
      logout: "Déconnexion",
      register: "S’inscrire",
      language: "Langue",
    },
    pagination: {
      prev: "Précédent",
      next: "Suivant",
      pageOf: "Page {page} / {totalPages}",
    },
    home: {
      heroTitle: "Achetez des essentiels modernes avec livraison rapide.",
      heroSubtitle:
        "Découvrez les produits en vedette, gérez votre panier et passez commande en paiement à la livraison.",
      browseProducts: "Voir les produits",
      viewCart: "Voir le panier",
      featured: "En vedette",
      featuredSubtitle: "Les dernières nouveautés de notre catalogue.",
      viewAll: "Tout voir",
      features: {
        fastDelivery: {
          title: "Livraison rapide",
          desc: "Nous livrons vos produits le plus rapidement possible.",
        },
        cod: {
          title: "Paiement à la livraison",
          desc: "Payez à la réception de votre commande.",
        },
        support: {
          title: "Support 24/7",
          desc: "Nous sommes là pour vous aider à tout moment.",
        },
      },
    },
    products: {
      title: "Produits",
      subtitle: "Parcourez les produits avec des filtres de catégorie et de prix.",
      searchLabel: "Recherche",
      categoryLabel: "Catégorie",
      minPriceLabel: "Prix min",
      maxPriceLabel: "Prix max",
      searchPlaceholder: "Rechercher",
      allCategories: "Toutes les catégories",
      minPricePlaceholder: "Prix min",
      maxPricePlaceholder: "Prix max",
      applyFilters: "Appliquer les filtres",
      loading: "Chargement…",
      notFound: "Produit introuvable",
      noImage: "Aucune image",
      inStock: "{count} en stock",
      outOfStock: "Rupture de stock",
      description: "Description",
      addToCart: "Ajouter au panier",
    },
    cart: {
      title: "Panier",
      subtitle: "Vérifiez les articles et passez au paiement.",
      continueShopping: "Continuer vos achats",
      empty: "Votre panier est vide.",
      loading: "Chargement…",
      noImage: "Pas d’image",
      productInactive: "Produit inactif",
      remove: "Retirer",
      summary: "Résumé",
      subtotal: "Sous-total",
      shipping: "Livraison",
      discount: "Remise",
      total: "Total",
      checkout: "Paiement",
      paymentHint: "Mode de paiement : Paiement à la livraison (COD).",
    },
    checkout: {
      title: "Paiement",
      subtitle: "Paiement à la livraison (à domicile).",
      empty: "Votre panier est vide.",
      fullName: "Nom complet",
      emailOptional: "E-mail (optionnel)",
      phone: "Téléphone",
      address1: "Adresse (ligne 1)",
      address2: "Adresse (ligne 2) (optionnel)",
      city: "Ville",
      postalCode: "Code postal",
      notesOptional: "Notes (optionnel)",
      placeOrder: "Valider la commande",
      placingOrder: "Commande en cours…",
      orderSummary: "Récapitulatif de commande",
    },
    auth: {
      loginTitle: "Connexion",
      loginSubtitle: "Content de vous revoir.",
      registerTitle: "Créer un compte",
      registerSubtitle: "Commencez à acheter en quelques minutes.",
      email: "E-mail",
      password: "Mot de passe",
      name: "Nom",
      signingIn: "Connexion…",
      creating: "Création…",
      noAccount: "Pas de compte ?",
      haveAccount: "Déjà un compte ?",
    },
    account: {
      title: "Compte",
      profile: "Profil",
      name: "Nom",
      role: "Rôle",
      security: "Sécurité",
      newEmail: "Nouvel e-mail",
      updateEmail: "Mettre à jour l’e-mail",
      emailUpdated: "E-mail mis à jour.",
      emailNoChange: "Veuillez saisir un e-mail différent.",
      currentPassword: "Mot de passe actuel",
      newPassword: "Nouveau mot de passe",
      confirmNewPassword: "Confirmer le nouveau mot de passe",
      updatePassword: "Mettre à jour le mot de passe",
      passwordUpdated: "Mot de passe mis à jour.",
      passwordRequired: "Veuillez saisir un nouveau mot de passe.",
      passwordTooShort: "Le mot de passe doit contenir au moins 8 caractères.",
      passwordMismatch: "Les mots de passe ne correspondent pas.",
      saving: "Enregistrement…",
      updateFailed: "Échec de la mise à jour.",
      orderHistory: "Historique des commandes",
      noOrders: "Aucune commande pour le moment.",
      view: "Voir",
      order: "Commande {id}",
    },
    order: {
      title: "Commande",
      orderId: "Commande {id}",
      items: "Articles",
      summary: "Résumé",
      status: "Statut",
      payment: "Paiement",
      subtotal: "Sous-total",
      discount: "Remise",
      shipping: "Livraison",
      total: "Total",
      loading: "Chargement…",
      backToAccount: "Retour au compte",
    },
    misc: {
      footer: "© {year} Ecom",
      loading: "Chargement…",
    },
  },
} satisfies Record<Language, Record<string, unknown>>;

function getByPath(obj: unknown, key: string): unknown {
  const parts = key.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (typeof cur !== "object" || cur === null) return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function interpolate(template: string, vars: Record<string, string | number | undefined> | undefined) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_m, name: string) => {
    const v = vars[name];
    return v === undefined ? "" : String(v);
  });
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const stored = getFromStorage(LANG_KEY);
    return stored === "fr" || stored === "en" ? stored : "fr";
  });

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    setToStorage(LANG_KEY, next);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const stored = getFromStorage(LANG_KEY);
      if (stored === "fr" || stored === "en") setLangState(stored);
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number | undefined>) => {
      const dict = translations[lang];
      const raw = getByPath(dict, key);
      if (typeof raw !== "string") return key;
      return interpolate(raw, vars);
    },
    [lang]
  );

  const value = useMemo<I18nContextValue>(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("I18nProvider missing");
  return ctx;
}
