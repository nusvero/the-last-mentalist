"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { checkoutAction } from "@/actions/checkout";
import { getShippingRatesAction } from "@/actions/shipping";
import { ShippingDestinationSearch } from "@/components/checkout/ShippingDestinationSearch";
import { formatRupiah } from "@/lib/format";
import type { ShippingCourierRate, ShippingDestination } from "@/lib/shipping/rajaongkir";
import { SUPPORTED_COURIERS } from "@/lib/validation/shipping";

const inputClass =
  "w-full rounded-md border border-border-dark bg-charcoal px-4 py-3 text-body text-ivory " +
  "placeholder:text-muted focus:border-gold focus:outline-none";

export function CheckoutForm({
  hasPhysicalItems,
  totalWeightGrams,
}: {
  hasPhysicalItems: boolean;
  totalWeightGrams: number;
}) {
  const router = useRouter();
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");

  const [city, setCity] = useState<string | null>(null);
  const [province, setProvince] = useState<string | null>(null);
  const [postalCode, setPostalCode] = useState<string | null>(null);

  const [rates, setRates] = useState<ShippingCourierRate[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [selectedRate, setSelectedRate] = useState<ShippingCourierRate | null>(null);

  const [submitting, startSubmit] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleDestinationSelect(destination: ShippingDestination) {
    setCity(destination.city);
    setProvince(destination.province);
    setPostalCode(destination.postalCode);
    setSelectedRate(null);
    setRates([]);
    setRatesError(null);
    setLoadingRates(true);

    const result = await getShippingRatesAction({
      destinationId: destination.id,
      weightGrams: totalWeightGrams,
      couriers: [...SUPPORTED_COURIERS],
    });

    setLoadingRates(false);
    if (result.status === "error") {
      setRatesError(result.message);
      return;
    }
    setRates(result.data);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (hasPhysicalItems && !selectedRate) {
      setSubmitError("Pilih kurir pengiriman terlebih dahulu.");
      return;
    }

    startSubmit(async () => {
      const result = await checkoutAction({
        shippingRecipientName: hasPhysicalItems ? recipientName : undefined,
        shippingPhone: hasPhysicalItems ? phone : undefined,
        shippingAddress: hasPhysicalItems ? address : undefined,
        shippingCity: city ?? undefined,
        shippingProvince: province ?? undefined,
        shippingPostalCode: postalCode ?? undefined,
        shippingCost: selectedRate?.costRupiah ?? 0,
        customerNote: note || undefined,
      });

      if (result.status === "error") {
        setSubmitError(result.message);
        return;
      }
      router.push(`/account/orders/${result.orderNumber}?checkout=sukses`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {hasPhysicalItems && (
        <section className="space-y-5">
          <h2 className="font-display text-h3 text-gold-pale">Alamat Pengiriman</h2>

          <div className="space-y-1.5">
            <label htmlFor="recipientName" className="text-body-sm text-muted">
              Nama penerima
            </label>
            <input
              id="recipientName"
              required
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="phone" className="text-body-sm text-muted">
              Nomor HP
            </label>
            <input
              id="phone"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
              className={inputClass}
            />
          </div>

          <ShippingDestinationSearch onSelect={handleDestinationSelect} />

          <div className="space-y-1.5">
            <label htmlFor="address" className="text-body-sm text-muted">
              Alamat lengkap (nama jalan, nomor rumah, RT/RW)
            </label>
            <textarea
              id="address"
              required
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={inputClass}
            />
          </div>

          {loadingRates && (
            <p className="text-body-sm text-muted">Menghitung ongkir...</p>
          )}
          {ratesError && <p className="text-body-sm text-ritual">{ratesError}</p>}

          {rates.length > 0 && (
            <div className="space-y-2">
              <p className="text-body-sm text-muted">Pilih kurir</p>
              {rates.map((rate) => {
                const key = `${rate.courierCode}-${rate.service}`;
                const selected =
                  selectedRate?.courierCode === rate.courierCode &&
                  selectedRate.service === rate.service;
                return (
                  <label
                    key={key}
                    className={`flex cursor-pointer items-center justify-between rounded-md border px-4 py-3 ${
                      selected ? "border-gold bg-raised" : "border-border-dark"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="courier"
                        checked={selected}
                        onChange={() => setSelectedRate(rate)}
                      />
                      <span className="text-body-sm text-ivory">
                        {rate.courierName} - {rate.service}
                        {rate.etd && (
                          <span className="text-muted"> ({rate.etd} hari)</span>
                        )}
                      </span>
                    </span>
                    <span className="text-body-sm text-gold-pale">
                      {formatRupiah(rate.costRupiah)}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </section>
      )}

      <section className="space-y-1.5">
        <label htmlFor="note" className="text-body-sm text-muted">
          Catatan untuk penjual (opsional)
        </label>
        <textarea
          id="note"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={inputClass}
        />
      </section>

      {submitError && <p className="text-body-sm text-ritual">{submitError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-gold px-5 py-3 font-semibold text-obsidian disabled:opacity-60"
      >
        {submitting ? "Memproses pesanan..." : "Buat Pesanan"}
      </button>
    </form>
  );
}
