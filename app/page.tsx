"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { db } from "./lib/firebase";

import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  doc,
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
  photo?: string;
  transactions: Transaction[];
};

export default function Home() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState("");
  const [showModal, setShowModal] = useState(false);

  // 🔊 Haptic
  const vibrate = () => {
    if (navigator.vibrate) navigator.vibrate(30);
  };

  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // 🔥 REALTIME FIREBASE LOAD
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "contacts"),
      (snapshot) => {
        setFirestoreError(null);
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Contact, "id">),
        }));
        setContacts(list);
      },
      (err) => {
        console.error("Firestore subscription failed", err);
        setFirestoreError(err?.message ?? String(err));
      }
    );

    return () => unsubscribe();
  }, []);

  // ➕ ADD CONTACT
  const addContact = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    vibrate();

    await addDoc(collection(db, "contacts"), {
      name: trimmed,
      photo: "",
      transactions: [],
    });

    setName("");
  };

  // 💰 BALANCE
  const getBalance = (transactions: Transaction[]) => {
    return transactions?.reduce((acc, t) => {
      return t.type === "give" ? acc + t.amount : acc - t.amount;
    }, 0) || 0;
  };

  // 📸 Upload photo → Firebase
  const uploadPhoto = async (id: string, file: File) => {
    const reader = new FileReader();

    reader.onload = async () => {
      const ref = doc(db, "contacts", id);

      await updateDoc(ref, {
        photo: reader.result,
      });
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white px-4 pt-6 pb-12 overflow-hidden">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-100px] left-[-80px] w-72 h-72 bg-purple-500 opacity-30 blur-3xl rounded-full"></div>
        <div className="absolute bottom-[-120px] right-[-60px] w-72 h-72 bg-blue-500 opacity-30 blur-3xl rounded-full"></div>
      </div>
      <div className="max-w-md mx-auto">
        {firestoreError && (
          <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {firestoreError}
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Hey, Abhi</h1>
              <p className="text-gray-400 text-sm">Your debt network</p>
            </div>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="mt-1 shrink-0 w-11 h-11 rounded-2xl bg-white/10 backdrop-blur border border-white/10 hover:bg-white/15 active:scale-95 transition flex items-center justify-center text-2xl leading-none shadow-lg"
              aria-label="Add person"
            >
              +
            </button>
          </div>
        </div>

        {/* Summary Card */}
        <div className="relative bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-5 mb-6 shadow-[0_8px_30px_rgba(0,0,0,0.3)] animate-float">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl pointer-events-none"></div>
          <p className="text-sm text-white/80">Total Balance</p>

          <p className="text-3xl font-bold mt-1 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            ₹{contacts.reduce((acc, c) => acc + getBalance(c.transactions || []), 0)}
          </p>

          <div className="flex justify-between mt-4 text-xs text-white/80">
            <span>
              You’ll Get: ₹{contacts
                .filter(c => getBalance(c.transactions || []) > 0)
                .reduce((a, c) => a + getBalance(c.transactions || []), 0)}
            </span>

            <span>
              You Owe: ₹{contacts
                .filter(c => getBalance(c.transactions || []) < 0)
                .reduce((a, c) => a + Math.abs(getBalance(c.transactions || [])), 0)}
            </span>
          </div>
        </div>

        {/* Top Owes Summary */}
        {contacts.length > 0 && (() => {
          const sorted = [...contacts].sort(
            (a, b) => Math.abs(getBalance(b.transactions || [])) - Math.abs(getBalance(a.transactions || []))
          );

          const top = sorted[0];
          const topBalance = getBalance(top.transactions || []);

          return (
            <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl p-4 mb-6 shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
              <p className="text-xs text-gray-400 mb-1">Top Contact</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold">
                    {top.name.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <p className="text-sm font-medium">{top.name}</p>
                    <p className="text-xs text-gray-400">
                      {topBalance > 0 ? "Owes you" : "You owe"}
                    </p>
                  </div>
                </div>

                <p
                  className={`text-sm font-semibold ${topBalance >= 0 ? "text-green-400" : "text-red-400"}`}
                >
                  ₹{Math.abs(topBalance)}
                </p>
              </div>
            </div>
          );
        })()}

        {/* Empty */}
        {contacts.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <p className="text-lg">👥 No people yet</p>
            <p className="text-sm">Add your first contact</p>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-3 gap-5">
          {[...contacts]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((c) => {
            const balance = getBalance(c.transactions || []);

            const colors = [
              "bg-pink-500",
              "bg-blue-500",
              "bg-green-500",
              "bg-purple-500",
              "bg-orange-500",
            ];
            const color = colors[c.name.charCodeAt(0) % colors.length];

            return (
              <div key={c.id} className="flex flex-col items-center">

                <Link
                  href={`/contact/${c.id}`}
                  className="flex flex-col items-center group transition duration-300 hover:scale-[1.05] active:scale-95"
                >
                  {/* Avatar */}
                  {c.photo ? (
                    <Image
                      src={c.photo}
                      alt={`${c.name} avatar`}
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full object-cover shadow-xl transition-all duration-200 group-active:scale-90"
                      unoptimized
                    />
                  ) : (
                    <div
                      className={`relative w-20 h-20 rounded-full ${color} flex items-center justify-center text-xl font-bold shadow-xl ring-2 ring-white/10 transition-all duration-200 group-active:scale-90`}
                    >
                      {c.name.charAt(0).toUpperCase()}
                      <div
                        className={`absolute bottom-1 right-1 w-4 h-4 rounded-full ${balance >= 0 ? "bg-green-400" : "bg-red-400"} border-2 border-black`}
                      />
                    </div>
                  )}

                  {/* Name */}
                  <p className="mt-2 text-sm font-medium text-white truncate w-full text-center">
                    {c.name}
                  </p>

                  {/* Balance */}
                  <p
                    className={`text-xs font-semibold ${balance >= 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    ₹{balance}
                  </p>
                </Link>

                {/* Upload */}
                <label className="text-xs text-gray-400 mt-1 cursor-pointer">
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadPhoto(c.id, file);
                    }}
                  />
                </label>

              </div>
            );
          })}
        </div>

      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end justify-center z-50">
          <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border-t border-white/10 rounded-t-3xl p-5 animate-slideUp">

            {/* Drag Handle */}
            <div className="w-12 h-1.5 bg-gray-600 rounded-full mx-auto mb-4"></div>

            <h2 className="text-lg font-semibold mb-4 text-center">Add Person</h2>

            <input
              className="w-full bg-white/10 backdrop-blur p-3 rounded-lg mb-4 outline-none text-white placeholder-gray-400"
              placeholder="Enter name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-white/10 backdrop-blur border border-white/10 p-3 rounded-xl"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  await addContact();
                  setShowModal(false);
                }}
                className="flex-1 bg-white text-black p-3 rounded-xl font-medium shadow-md active:scale-95 transition"
              >
                Add
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
/* Add in globals.css if not exists */
