"use client";

import { useId, useState } from "react";
import { Link } from "@/i18n/navigation";
import { cart, CART_MAX_QTY } from "./store";

export type PickerVariant = {
  id: string;
  label: string;
  price: string;
  stock: number;
  status: string;
};

type Strings = { size: string; quantity: string; add: string; added: string; viewCart: string; decrease: string; increase: string };

/** Choose a size and quantity, then add to the cart. Sold-out sizes are shown but disabled. */
export function VariantPicker({ variants, strings }: { variants: PickerVariant[]; strings: Strings }) {
  const name = useId();
  const firstAvailable = variants.find((v) => v.stock > 0)?.id ?? null;
  const [selected, setSelected] = useState<string | null>(firstAvailable);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const current = variants.find((v) => v.id === selected);
  const max = Math.min(CART_MAX_QTY, current?.stock ?? 0);

  return (
    <div className="mt-4">
      <fieldset>
        <legend className="sr-only">{strings.size}</legend>
        {variants.map((v) => {
          const disabled = v.stock <= 0;
          return (
            <label
              key={v.id}
              className={`rule flex cursor-pointer items-baseline justify-between gap-4 border-t py-3 last:border-b ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <span className="flex items-baseline gap-3">
                <input
                  type="radio"
                  name={name}
                  value={v.id}
                  checked={selected === v.id}
                  disabled={disabled}
                  onChange={() => {
                    setSelected(v.id);
                    setQty(1);
                    setAdded(false);
                  }}
                  className="h-4 w-4 accent-[var(--realm-accent)]"
                />
                <span className="text-lg">{v.label}</span>
              </span>
              <span className="text-base text-realm-ink/75">{v.status}</span>
              <span className="font-display text-lg tabular-nums">{v.price}</span>
            </label>
          );
        })}
      </fieldset>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <div className="rule flex items-center border" role="group" aria-label={strings.quantity}>
          <button
            type="button"
            aria-label={strings.decrease}
            disabled={qty <= 1}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="h-11 w-11 text-xl disabled:opacity-40"
          >
            -
          </button>
          <output aria-live="polite" className="w-8 text-center tabular-nums">
            {qty}
          </output>
          <button
            type="button"
            aria-label={strings.increase}
            disabled={qty >= max}
            onClick={() => setQty((q) => Math.min(max, q + 1))}
            className="h-11 w-11 text-xl disabled:opacity-40"
          >
            +
          </button>
        </div>
        <button
          type="button"
          disabled={!current || current.stock <= 0}
          onClick={() => {
            if (!current) return;
            cart.add(current.id, qty);
            setAdded(true);
          }}
          className="font-display h-11 border border-realm-accent bg-realm-accent px-6 text-lg tracking-[0.08em] text-realm-base transition-colors duration-500 hover:bg-transparent hover:text-realm-accent disabled:opacity-40"
        >
          {strings.add}
        </button>
      </div>
      <p role="status" className="mt-3 min-h-6 text-base">
        {added && (
          <>
            {strings.added}.{" "}
            <Link href="/cart" className="text-realm-accent underline underline-offset-4">
              {strings.viewCart}
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
