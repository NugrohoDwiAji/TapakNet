"use client";

import { useState } from "react";
import { settleVouchers } from "@/actions/voucher-actions";
import { X, Calculator, AlertTriangle, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { PaymentMethod } from "@prisma/client";

interface SettlementModalProps {
  partner: any;
  packages: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function SettlementModal({
  partner,
  packages,
  onClose,
  onSuccess,
}: SettlementModalProps) {
  const [settlementDate, setSettlementDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Input mode: 'REMAINING' (Hitung dari Sisa Fisik di Warung) or 'SOLD' (Input Langsung Qty Laku)
  const [inputMode, setInputMode] = useState<"REMAINING" | "SOLD">("REMAINING");

  // Track user input per package
  // packageId -> { remaining: number, sold: number }
  const [itemInputs, setItemInputs] = useState<
    Record<string, { remaining: number; sold: number }>
  >(() => {
    const initial: Record<string, { remaining: number; sold: number }> = {};
    packages.forEach((pkg) => {
      const currentStock =
        partner.stocks.find((s: any) => s.packageId === pkg.id)?.quantity || 0;
      initial[pkg.id] = { remaining: currentStock, sold: 0 };
    });
    return initial;
  });

  // Calculate pricing & totals
  let calculatedExpectedOwnerShare = 0;
  let totalGrossOmset = 0;
  let totalPartnerFeeEarned = 0;

  const itemCalculations = packages.map((pkg) => {
    const currentStock =
      partner.stocks.find((s: any) => s.packageId === pkg.id)?.quantity || 0;
    const inputs = itemInputs[pkg.id] || { remaining: currentStock, sold: 0 };

    // Pricing snapshot
    const customPrice = partner.customPricings?.find((cp: any) => cp.packageId === pkg.id);
    const ownerShare = customPrice ? customPrice.customOwnerShare : pkg.defaultOwnerShare;
    const sellPrice = pkg.sellPrice;
    const partnerFee = sellPrice - ownerShare;

    const subtotalOwner = inputs.sold * ownerShare;
    const subtotalGross = inputs.sold * sellPrice;
    const subtotalPartnerFee = inputs.sold * partnerFee;

    calculatedExpectedOwnerShare += subtotalOwner;
    totalGrossOmset += subtotalGross;
    totalPartnerFeeEarned += subtotalPartnerFee;

    return {
      pkg,
      currentStock,
      sold: inputs.sold,
      remaining: inputs.remaining,
      sellPrice,
      ownerShare,
      partnerFee,
      subtotalOwner,
    };
  });

  const [actualReceived, setActualReceived] = useState<number | string>(() =>
    calculatedExpectedOwnerShare.toString()
  );

  const numActualReceived =
    actualReceived === "" ? 0 : Number(actualReceived);

  // Sync actualReceived when calculated expected changes and user hasn't manually overridden it
  const [userEditedActual, setUserEditedActual] = useState(false);
  const effectiveExpected = calculatedExpectedOwnerShare;
  const shortfall = effectiveExpected - numActualReceived;

  // Handlers for switching and inputting
  const handleRemainingChange = (pkgId: string, currentStock: number, val: string) => {
    const remainingVal = Math.max(0, parseInt(val) || 0);
    const calculatedSold = Math.max(0, currentStock - remainingVal);
    setItemInputs((prev) => ({
      ...prev,
      [pkgId]: { remaining: remainingVal, sold: calculatedSold },
    }));
  };

  const handleSoldChange = (pkgId: string, currentStock: number, val: string) => {
    const soldVal = Math.max(0, parseInt(val) || 0);
    const calculatedRemaining = Math.max(0, currentStock - soldVal);
    setItemInputs((prev) => ({
      ...prev,
      [pkgId]: { remaining: calculatedRemaining, sold: soldVal },
    }));
  };

  const handleUseExactExpected = () => {
    setActualReceived(effectiveExpected);
    setUserEditedActual(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const totalSold = itemCalculations.reduce((s, i) => s + i.sold, 0);
    if (totalSold === 0 && numActualReceived === 0) {
      setError("Tidak ada voucher laku atau setoran uang yang dicatat.");
      return;
    }

    try {
      setLoading(true);
      await settleVouchers({
        partnerId: partner.id,
        settlementDate,
        paymentMethod,
        notes,
        actualReceived: numActualReceived,
        items: itemCalculations.map((i) => ({
          packageId: i.pkg.id,
          soldQuantity: i.sold,
          remainingStock: i.remaining,
        })),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal memproses setoran voucher");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0B4EA2] flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#072255]">
                Tarik Setoran & Rekonsiliasi Stok Voucher
              </h3>
              <p className="text-xs text-slate-500">
                Mitra: <span className="font-semibold text-slate-800">{partner.name}</span>
                {partner.unpaidBalance > 0 && (
                  <span className="ml-2 text-rose-600 font-bold">
                    (Ada Hutang Sebelumnya: {formatRupiah(partner.unpaidBalance)})
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="my-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Mode Selector */}
        <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs font-semibold text-slate-700">
            Metode Penghitungan Setoran:
          </div>
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold shadow-sm">
            <button
              type="button"
              onClick={() => setInputMode("REMAINING")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                inputMode === "REMAINING"
                  ? "bg-[#0B4EA2] text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              1. Hitung Sisa Fisik (Rekomendasi)
            </button>
            <button
              type="button"
              onClick={() => setInputMode("SOLD")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                inputMode === "SOLD"
                  ? "bg-[#0B4EA2] text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              2. Input Qty Laku
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Penarikan Setoran
              </label>
              <input
                type="date"
                value={settlementDate}
                onChange={(e) => setSettlementDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Metode Pembayaran
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2] bg-white"
              >
                <option value={PaymentMethod.CASH}>Tunai (Cash / Cash on Hand)</option>
                <option value={PaymentMethod.TRANSFER}>Transfer Bank / QRIS</option>
              </select>
            </div>
          </div>

          {/* Package Rows */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Paket Voucher & Rekap Laku</span>
              <span className="text-[11px] text-slate-400">
                Formula: Qty Laku = Stok Awal - Sisa Fisik
              </span>
            </div>

            {itemCalculations.map((item) => (
              <div
                key={item.pkg.id}
                className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <span className="font-bold text-sm text-[#072255]">{item.pkg.name}</span>
                    <span className="ml-2 text-xs font-semibold text-slate-500">
                      (Jual: {formatRupiah(item.sellPrice)} | Hak Owner:{" "}
                      <span className="text-[#0B4EA2]">{formatRupiah(item.ownerShare)}</span> | Warung:{" "}
                      <span className="text-emerald-600">{formatRupiah(item.partnerFee)}</span>)
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Stok Tercatat: <strong className="text-slate-800">{item.currentStock} pcs</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  {inputMode === "REMAINING" ? (
                    <>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Sisa Fisik Dihitung:
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={item.currentStock}
                          value={item.remaining}
                          onChange={(e) =>
                            handleRemainingChange(item.pkg.id, item.currentStock, e.target.value)
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-center text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Auto Qty Laku:
                        </label>
                        <div className="w-full px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/50 font-black text-center text-sm text-[#0B4EA2]">
                          {item.sold} pcs
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Input Qty Laku:
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={item.currentStock}
                          value={item.sold}
                          onChange={(e) =>
                            handleSoldChange(item.pkg.id, item.currentStock, e.target.value)
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-center text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Auto Sisa Stok:
                        </label>
                        <div className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-100 font-bold text-center text-sm text-slate-700">
                          {item.remaining} pcs
                        </div>
                      </div>
                    </>
                  )}

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Subtotal Setoran Owner:
                    </label>
                    <div className="w-full px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50/50 font-bold text-right text-sm text-emerald-800">
                      {formatRupiah(item.subtotalOwner)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Settlement Financial Summary Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/50 border border-blue-100 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Total Omset Penjualan (Gross):</span>
              <span className="font-semibold">{formatRupiah(totalGrossOmset)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-emerald-700">
              <span>Bagian Warung (Margin Mitra):</span>
              <span className="font-bold">+{formatRupiah(totalPartnerFeeEarned)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
              <span className="font-bold text-[#072255]">Hak Bersih Owner (Wajib Disetor):</span>
              <span className="font-black text-[#0B4EA2] text-base">
                {formatRupiah(effectiveExpected)}
              </span>
            </div>

            {/* Actual Received Input & Shortfall calculation */}
            <div className="pt-3 border-t border-blue-200/60 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Uang Tunai / Transfer Diterima Real:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={actualReceived}
                    onChange={(e) => {
                      setActualReceived(e.target.value);
                      setUserEditedActual(true);
                    }}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 font-black text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B4EA2] bg-white"
                  />
                </div>
                {!userEditedActual && (
                  <button
                    type="button"
                    onClick={handleUseExactExpected}
                    className="mt-1 text-[11px] text-[#0B4EA2] hover:underline"
                  >
                    Pas / Sesuai Total ({formatRupiah(effectiveExpected)})
                  </button>
                )}
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm text-xs">
                <span className="text-slate-500 block mb-0.5">Status Selisih Setoran:</span>
                {shortfall === 0 ? (
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Lunas Sempurna (Pas)
                  </span>
                ) : shortfall > 0 ? (
                  <div>
                    <span className="font-black text-rose-600 text-sm">
                      Kurang Bayar: {formatRupiah(shortfall)}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      *Akan otomatis ditambahkan ke Piutang Mitra
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="font-black text-blue-600 text-sm">
                      Lebih Bayar: {formatRupiah(Math.abs(shortfall))}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      *Mengurangi saldo piutang mitra
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Rekonsiliasi (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Titip sisa setoran ke rekening BCA, sisa 15k dibayar besok"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Snapshot harga & jurnal kas tersimpan otomatis.</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-[#0B4EA2] hover:bg-blue-800 rounded-xl transition-colors disabled:opacity-50 shadow-md shadow-blue-900/20"
              >
                {loading ? "Memproses..." : "Simpan & Bukukan Setoran"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
