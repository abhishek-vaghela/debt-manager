"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/app/lib/firebase";
import {
    doc,
    onSnapshot,
    updateDoc,
} from "firebase/firestore";

type Transaction = {
    id: string;
    amount: number;
    type: "give" | "take";
    date: string;
};

type Contact = {
    id: string;
    name: string;
    transactions: Transaction[];
};

export default function ContactPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [contact, setContact] = useState<Contact | null>(null);
    const [amount, setAmount] = useState("");

    // 🔥 REALTIME FETCH FROM FIREBASE
    useEffect(() => {
        if (!id) return;

        const ref = doc(db, "contacts", id);

        const unsub = onSnapshot(ref, (snap) => {
            if (snap.exists()) {
                setContact({
                    id: snap.id,
                    ...(snap.data() as Omit<Contact, "id">),
                });
            } else {
                setContact(null);
            }
        });

        return () => unsub();
    }, [id]);

    // ➕ ADD TRANSACTION
    const addTransaction = async (type: "give" | "take") => {
        if (!amount || !contact) return;

        const newTx: Transaction = {
            id: Date.now().toString(),
            amount: parseInt(amount),
            type,
            date: new Date().toLocaleDateString(),
        };

        const updated = [...(contact.transactions || []), newTx];

        await updateDoc(doc(db, "contacts", id), {
            transactions: updated,
        });

        setAmount("");
    };

    // ❌ DELETE
    const deleteTransaction = async (txId: string) => {
        if (!contact) return;

        const updated = contact.transactions.filter((t) => t.id !== txId);

        await updateDoc(doc(db, "contacts", id), {
            transactions: updated,
        });
    };

    // 🧹 CLEAR
    const clearAll = async () => {
        if (!confirm("Clear all transactions?")) return;

        await updateDoc(doc(db, "contacts", id), {
            transactions: [],
        });
    };

    // 💰 BALANCE
    const balance =
        contact?.transactions?.reduce((acc, t) => {
            return t.type === "give" ? acc + t.amount : acc - t.amount;
        }, 0) || 0;

    if (!contact)
        return <div className="p-6 text-white">Contact not found ❌</div>;

    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white px-4 py-6">
        <div className="max-w-md mx-auto">

          {/* Top Bar */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.push("/")}
              className="text-gray-400 text-xl active:scale-90 transition"
            >
              ←
            </button>
            <h1 className="text-xl font-semibold">Details</h1>
          </div>

          {/* Profile Card */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl p-5 mb-5 shadow-xl border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
                {contact.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-lg font-semibold">{contact.name}</h2>
            </div>

            <p className="text-sm text-white/80 mt-3">Balance</p>
            <p className={`text-2xl font-bold ${balance >= 0 ? "text-green-200" : "text-red-200"}`}>
              ₹{Math.abs(balance)}
            </p>
            <p className="text-xs text-white/70">
              {balance > 0 ? "You will get" : balance < 0 ? "You owe" : "All settled"}
            </p>
          </div>

          {/* Input Card */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl p-4 mb-4 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-3 bg-white/10 backdrop-blur rounded-lg mb-3 outline-none placeholder-gray-400"
              placeholder="₹ Enter amount"
            />

            <div className="flex gap-2 mb-2">
              {[100, 500, 1000].map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(val.toString())}
                  className="bg-white/10 backdrop-blur border border-white/10 px-3 py-1 rounded-lg text-sm"
                >
                  ₹{val}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => addTransaction("give")}
                className="flex-1 bg-green-500 active:scale-95 transition p-3 rounded-xl font-medium"
              >
                + You Gave
              </button>

              <button
                onClick={() => addTransaction("take")}
                className="flex-1 bg-red-500 active:scale-95 transition p-3 rounded-xl font-medium"
              >
                - You Took
              </button>
            </div>
          </div>

          {/* Clear */}
          <button
            onClick={clearAll}
            className="text-xs text-red-400 mb-3"
          >
            Clear All
          </button>

          {/* Transactions */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
            <h2 className="text-sm text-gray-400 mb-3">Transactions</h2>

            {contact.transactions?.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">
                🧾 No transactions yet
              </p>
            )}

            <div className="space-y-2">
              {contact.transactions?.slice().reverse().map((t) => (
                <div
                  key={t.id}
                  className="flex justify-between items-center bg-white/5 backdrop-blur border border-white/10 p-3 rounded-xl"
                >
                  <div>
                    <p className={`font-medium ${t.type === "give" ? "text-green-400" : "text-red-400"}`}>
                      {t.type === "give" ? "+" : "-"}₹{t.amount}
                    </p>
                    <p className="text-xs text-gray-400">{t.date}</p>
                  </div>

                  <button
                    onClick={() => deleteTransaction(t.id)}
                    className="text-xs text-red-400"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    );
}