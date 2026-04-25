"use client";
import { usePathname, useRouter } from "next/navigation";

export default function BottomNav() {
    const router = useRouter();
    const path = usePathname();

    const tabs = [
        { name: "People", path: "/" },
        { name: "Add", path: "/" },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 flex justify-around bg-black/70 backdrop-blur-md py-3 border-t border-gray-800">
            {tabs.map((tab) => (
                <button
                    key={tab.name}
                    onClick={() => router.push(tab.path)}
                    className={`text-sm ${path === tab.path ? "text-white" : "text-gray-400"
                        }`}
                >
                    {tab.name}
                </button>
            ))}
        </div>
    );
}