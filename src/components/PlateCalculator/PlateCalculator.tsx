import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { calculatePlates, PlateResult } from "../../utils/plateCalculator";
import { PlateVisualizer } from "./PlateVisualizer";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialWeight?: number;
  onSelectWeight?: (weight: number) => void; // opcional: preencher campo
}

export function PlateCalculator({ isOpen, onClose, initialWeight = 60, onSelectWeight }: Props) {
  const [totalWeight, setTotalWeight] = useState(initialWeight);
  const [barWeight, setBarWeight] = useState(20);
  const [result, setResult] = useState<PlateResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const res = calculatePlates(totalWeight, barWeight);
    if ("error" in res) {
      setError(res.error);
      setResult(null);
    } else {
      setError(null);
      setResult(res);
    }
  }, [totalWeight, barWeight, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTotalWeight(initialWeight);
    }
  }, [isOpen, initialWeight]);

  const handleApply = () => {
    onSelectWeight?.(totalWeight);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" style={{ position: "fixed", inset: 0, zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-[90%] max-w-md rounded-2xl border border-[#e8c84a]/30 bg-[#131920] p-5 shadow-2xl"
          style={{ width: "90%", maxWidth: "400px", borderRadius: "16px", border: "1px solid rgba(232, 200, 74, 0.3)", background: "#131920", padding: "20px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
        >
          <h2 className="mb-4 font-bebas text-2xl tracking-wider text-[#e8c84a]" style={{ marginBottom: "16px", fontFamily: "'Bebas Neue'", fontSize: "24px", letterSpacing: "2px", color: "#e8c84a" }}>
            Calculadora de Discos 🏋️
          </h2>

          <div className="mb-4" style={{ marginBottom: "16px" }}>
            <label className="mb-1 block text-xs text-gray-400" style={{ marginBottom: "4px", display: "block", fontSize: "12px", color: "#9ca3af" }}>Peso total (kg)</label>
            <input
              type="number"
              value={totalWeight}
              onChange={(e) => setTotalWeight(Number(e.target.value))}
              className="w-full rounded-lg border border-[#2a2f36] bg-[#0f1419] px-3 py-2 text-white"
              style={{ width: "100%", borderRadius: "8px", border: "1px solid #2a2f36", background: "#0f1419", padding: "8px 12px", color: "#ffffff", boxSizing: "border-box" }}
              step="2.5"
            />
          </div>

          <div className="mb-4" style={{ marginBottom: "16px" }}>
            <label className="mb-1 block text-xs text-gray-400" style={{ marginBottom: "4px", display: "block", fontSize: "12px", color: "#9ca3af" }}>Peso da barra (kg)</label>
            <input
              type="number"
              value={barWeight}
              onChange={(e) => setBarWeight(Number(e.target.value))}
              className="w-full rounded-lg border border-[#2a2f36] bg-[#0f1419] px-3 py-2 text-white"
              style={{ width: "100%", borderRadius: "8px", border: "1px solid #2a2f36", background: "#0f1419", padding: "8px 12px", color: "#ffffff", boxSizing: "border-box" }}
              step="5"
            />
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-900/30 p-2 text-center text-sm text-red-300" style={{ marginBottom: "16px", borderRadius: "8px", background: "rgba(127, 29, 29, 0.3)", padding: "8px", textAlign: "center", fontSize: "14px", color: "#fca5a5" }}>
              {error}
            </div>
          )}

          {result && (
            <div className="mb-4" style={{ marginBottom: "16px" }}>
              <PlateVisualizer plates={result} barWeight={barWeight} />
              <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs text-gray-300" style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px", fontSize: "12px", color: "#d1d5db" }}>
                {result.map((p) => (
                  <span key={p.disc} className="rounded-full px-2 py-1" style={{ background: p.color + "33", borderRadius: "9999px", padding: "4px 8px" }}>
                    {p.disc}kg × {p.quantityPerSide} (cada lado)
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3" style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-600 py-2 text-white transition hover:bg-gray-800"
              style={{ flex: 1, borderRadius: "8px", border: "1px solid #4b5563", padding: "8px", color: "#ffffff", background: "transparent", cursor: "pointer" }}
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              className="flex-1 rounded-lg bg-[#e8c84a] py-2 font-bold text-black transition hover:bg-[#d4b83a]"
              style={{ flex: 1, borderRadius: "8px", background: "#e8c84a", padding: "8px", fontWeight: "bold", color: "#000000", border: "none", cursor: "pointer" }}
            >
              Aplicar peso
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
