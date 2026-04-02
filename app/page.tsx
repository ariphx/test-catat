"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence, useSpring, useTransform, Variants } from "framer-motion";

// --- KOMPONEN ANIMASI ANGKA ---
const AnimatedNumber = ({ value }: { value: number }) => {
  const spring = useSpring(0, { bounce: 0, duration: 1500 });
  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString("id-ID")
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
};

// --- VARIANTS UNTUK LIST MUNCUL BERURUTAN ---
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 24 
    } 
  }
} as const;

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"stats" | "add" | "history">("stats");

  // State User & Data
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // State Form
  const [type, setType] = useState<"expense" | "income">("expense");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");

  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState(getLocalDateString());

  // State Filter Bulan & Tahun
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const categories = useMemo(() => {
    return type === "income"
      ? ["Gaji", "Arisan", "JM", "Investasi", "Lainnya"]
      : ["Baju", "Arisan", "Transportasi", "Kebutuhan Harian", "Makan", "Tagihan", "Hiburan", "Lainnya"];
  }, [type]);

  useEffect(() => {
    const checkUserAndFetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
        fetchTransactions(session.user.id);
      }
    };
    checkUserAndFetchData();
  }, [router]);

  const fetchTransactions = async (userId: string) => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .order("id", { ascending: false });

    if (error) {
      console.error("Gagal menarik data:", error);
      alert("Ada masalah koneksi ke database. Coba muat ulang halaman.");
    } else if (data) {
      setTransactions(data);
    }
    setIsLoading(false);
  };

  const handleSaveTransaction = async () => {
    if (!name || !amount || !category || !date) return;

    setIsSaving(true);
    const rawAmount = Number(amount.replace(/\./g, ""));

    const { error } = await supabase.from("transactions").insert({
      name, amount: rawAmount, type, category, date, user_id: user.id
    });

    if (error) {
      alert("Gagal menyimpan: " + error.message);
    } else {
      // Reset Form & kembalikan ke tanggal hari ini
      setName(""); setAmount(""); setCategory(""); setDate(getLocalDateString());

      await fetchTransactions(user.id);

      const [y, m] = date.split('-');
      setCurrentMonth(parseInt(m, 10) - 1);
      setCurrentYear(parseInt(y, 10));

      setActiveTab("history");
    }
    setIsSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const rawValue = e.target.value.replace(/[^0-9]/g, "");
  if (!rawValue) { 
    setAmount(""); 
    return; 
  }
  // Cegah user masukin "000", otomatis dibaca "0"
  if (rawValue === "0") {
    setAmount("0");
    return;
  }
  setAmount(new Intl.NumberFormat("id-ID").format(Number(rawValue)));
};

  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(dateObj);
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return "";
    const dateObj = new Date(isoString);
    return dateObj.toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/\./g, ':');
  };

  const isCurrentMonth = currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (isCurrentMonth) return;
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (!t.date) return false;
    const [tYear, tMonth] = t.date.split('-');
    return parseInt(tMonth, 10) - 1 === currentMonth && parseInt(tYear, 10) === currentYear;
  });

  const allTimeIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const allTimeExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const totalBalance = allTimeIncome - allTimeExpense;

  const monthlyIncome = filteredTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const monthlyExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);

  const expenseByCategory = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc: any, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {});

  const isFormValid = name && amount && category && date;
  const usernameDisplay = user?.email ? user.email.split('@')[0] : 'Pengguna';

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-white flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-sky-500"></div>
      </div>
    );
  }

  const MonthSelector = () => (
    <div className="flex items-center gap-4 mb-4">
      <button
        onClick={handlePrevMonth}
        className="text-slate-400 hover:text-sky-500 active:scale-90 transition-all p-1"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
      </button>
      <span className="text-sm font-extrabold text-slate-800 uppercase tracking-widest min-w-[120px] text-center">
        {monthNames[currentMonth]} {currentYear}
      </span>
      <button
        onClick={handleNextMonth}
        disabled={isCurrentMonth}
        className={`p-1 transition-all ${isCurrentMonth
            ? 'text-slate-200 cursor-not-allowed'
            : 'text-slate-400 hover:text-sky-500 active:scale-90'
          }`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
      </button>
    </div>
  );

  return (
    <main className="w-full max-w-md mx-auto h-screen bg-white flex flex-col relative sm:border-x sm:border-slate-100 overflow-hidden font-sans text-slate-900">

      {/* HEADER */}
      <header className="px-6 pt-12 pb-2 bg-white flex justify-between items-center z-10 sticky top-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2 }}
            className="flex-1"
          >
            {activeTab === "stats" && (
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 capitalize">
                Halo, {usernameDisplay}.
              </h1>
            )}
            {activeTab === "add" && (
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Catat Transaksi
              </h1>
            )}
            {activeTab === "history" && (
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Riwayat Lengkap
              </h1>
            )}
          </motion.div>
        </AnimatePresence>

        <button
          onClick={handleLogout}
          title="Keluar"
          className="p-2 text-slate-300 hover:text-rose-500 active:scale-90 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
        </button>
      </header>

      {/* SCROLLABLE CONTENT WITH ANIMATE PRESENCE */}
      <div className="flex-1 overflow-y-auto pb-28 px-6 pt-6 no-scrollbar">
        <AnimatePresence mode="wait">

          {/* ================= VIEW: STATS (DASHBOARD) ================= */}
          {activeTab === "stats" && (
            <motion.div
              key="stats-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="flex flex-col items-center justify-center pt-2">
                <MonthSelector />
              </div>

              <div className="bg-sky-500 rounded-[1.5rem] p-7 text-white shadow-[0_8px_20px_rgb(14,165,233,0.2)]">
                <p className="text-sky-100 text-[11px] font-bold uppercase tracking-widest mb-1">Total Saldo Anda</p>
                <h2 className="text-4xl font-extrabold tracking-tight mb-8">
                  Rp <AnimatedNumber value={totalBalance} />
                </h2>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <p className="text-[10px] text-sky-100 font-bold uppercase tracking-widest mb-1 truncate">Masuk ({monthNames[currentMonth]})</p>
                    <p className="font-semibold text-sm">Rp <AnimatedNumber value={monthlyIncome} /></p>
                  </div>
                  <div className="w-px bg-sky-400/50"></div>
                  <div className="flex-1">
                    <p className="text-[10px] text-sky-100 font-bold uppercase tracking-widest mb-1 truncate">Keluar ({monthNames[currentMonth]})</p>
                    <p className="font-semibold text-sm">Rp <AnimatedNumber value={monthlyExpense} /></p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-extrabold mb-4 text-slate-800 tracking-tight">Pengeluaran Bulan Ini</h3>
                <div className="border border-slate-100 rounded-[1.5rem] p-6 space-y-5">
                  {Object.keys(expenseByCategory).length === 0 ? (
                    <p className="text-sm text-slate-400 font-medium text-center py-4">Belum ada aktivitas.</p>
                  ) : (
                    Object.entries(expenseByCategory).map(([cat, val]: any) => (
                      <div key={cat}>
                        <div className="flex justify-between text-sm font-semibold mb-2.5">
                          <span className="text-slate-500">{cat}</span>
                          <span className="text-slate-900">Rp {val.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <motion.div
                            className="bg-sky-500 h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${(val / monthlyExpense) * 100}%` }}
                            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {filteredTransactions.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-5 mt-2">
                    <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">Terbaru</h3>
                    <button onClick={() => setActiveTab("history")} className="text-sm font-bold text-sky-500 hover:text-sky-600 transition-colors">Lihat Semua</button>
                  </div>
                  
                  {/* ANIMASI LIST MUNCUL BERURUTAN */}
                  <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
                    {filteredTransactions.slice(0, 3).map((trx) => (
                      <motion.div variants={itemVariants} key={trx.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${trx.type === 'income' ? 'bg-emerald-50 border-emerald-100/50 text-emerald-500' : 'bg-rose-50 border-rose-100/50 text-rose-500'}`}>
                            {trx.type === 'income' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5" /><path d="M5 12l7-7 7 7" /></svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></svg>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-base">{trx.name}</p>
                            <div className="flex items-center text-[12px] font-medium text-slate-500 mt-0.5">
                              <span>{trx.category}</span>
                              {trx.created_at && (
                                <>
                                  <span className="mx-1.5 text-slate-300">•</span>
                                  <span>{formatTime(trx.created_at)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={`font-bold text-base ${trx.type === "income" ? "text-emerald-500" : "text-slate-900"}`}>
                          {trx.type === "income" ? "+" : "-"} {trx.amount.toLocaleString("id-ID")}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}

          {/* ================= VIEW: TAMBAH (ADD) ================= */}
          {activeTab === "add" && (
            <motion.div
              key="add-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="pt-2"
            >
              <div className="flex bg-slate-50 p-1.5 rounded-xl mb-10 border border-slate-100">
                <button
                  onClick={() => { setType("expense"); setCategory(""); }}
                  className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${type === "expense" ? "bg-white text-rose-500 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                >
                  Pengeluaran
                </button>
                <button
                  onClick={() => { setType("income"); setCategory(""); }}
                  className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${type === "income" ? "bg-white text-emerald-500 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                >
                  Pemasukan
                </button>
              </div>

              <div className="mb-12 w-full">
  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-4">
    Nominal Transaksi
  </label>
  {/* Perbaikan: items-baseline biar garis bawah "Rp" dan angka sejajar mulus */}
  <div className="flex items-baseline gap-3 border-b-2 border-slate-200 focus-within:border-sky-500 pb-2 transition-colors w-full overflow-hidden">
    <span className="text-3xl font-bold text-slate-400 shrink-0">Rp</span>
    <input
      type="text"
      inputMode="numeric"
      placeholder="0"
      value={amount}
      onChange={handleAmountChange}
      // Perbaikan: text-4xl (muat lebih banyak angka), text-left (nempel sama Rp), min-w-0 (mencegah bug overflow)
      className="w-full bg-transparent text-4xl sm:text-5xl font-extrabold text-slate-900 focus:outline-none placeholder:text-slate-200 text-left tracking-tight min-w-0"
    />
  </div>
</div>

              <div className="space-y-6">
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-500">Keterangan</label>
                  <input
                    type="text"
                    placeholder="Misal: Kopi Susu"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 h-14 text-base font-medium focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-slate-500">Tanggal</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      max={getLocalDateString()}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 h-14 text-sm font-medium focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all text-slate-700"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-slate-500">Kategori</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 h-14 text-sm font-medium focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all appearance-none text-slate-700"
                    >
                      <option value="" disabled>Pilih</option>
                      {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    onClick={handleSaveTransaction}
                    disabled={isSaving || !isFormValid}
                    className="w-full bg-sky-500 text-white font-bold rounded-xl h-14 shadow-sm hover:bg-sky-600 active:scale-[0.98] transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {isSaving ? "Menyimpan..." : "Simpan Transaksi"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ================= VIEW: RIWAYAT (HISTORY) ================= */}
          {activeTab === "history" && (
            <motion.div
              key="history-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="pt-2"
            >
              <div className="flex flex-col items-center justify-center mb-4">
                <MonthSelector />
              </div>

              <div className="space-y-8 mt-2">
                {filteredTransactions.length === 0 ? (
                  <p className="text-slate-400 font-medium text-center py-10">Belum ada riwayat di bulan ini.</p>
                ) : (
                  Array.from(new Set(filteredTransactions.map(t => t.date))).map((groupDate: string) => (
                    <div key={groupDate}>
                      <p className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">{formatDateIndo(groupDate)}</p>
                      
                      {/* ANIMASI LIST MUNCUL BERURUTAN */}
                      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
                        {filteredTransactions.filter(t => t.date === groupDate).map((trx) => (
                          <motion.div variants={itemVariants} key={trx.id} className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${trx.type === 'income' ? 'bg-emerald-50 border-emerald-100/50 text-emerald-500' : 'bg-rose-50 border-rose-100/50 text-rose-500'}`}>
                                {trx.type === 'income' ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5" /><path d="M5 12l7-7 7 7" /></svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></svg>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-base">{trx.name}</p>
                                <div className="flex items-center text-[12px] font-medium text-slate-500 mt-0.5">
                                  <span>{trx.category}</span>
                                  {trx.created_at && (
                                    <>
                                      <span className="mx-1.5 text-slate-300">•</span>
                                      <span>{formatTime(trx.created_at)}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className={`font-bold text-base ${trx.type === "income" ? "text-emerald-500" : "text-slate-900"}`}>
                              {trx.type === "income" ? "+" : "-"} {trx.amount.toLocaleString("id-ID")}
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* BOTTOM NAVIGATION */}
      <nav className="absolute bottom-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-100 px-6 pt-3 pb-safe-bottom z-20">
        <div className="flex justify-around items-center h-14 pb-2">
          <button onClick={() => setActiveTab("stats")} className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === "stats" ? "text-sky-500" : "text-slate-400 hover:text-slate-600"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={activeTab === "stats" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
            <span className="text-[10px] font-bold">Beranda</span>
          </button>

          <button onClick={() => setActiveTab("add")} className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === "add" ? "text-sky-500" : "text-slate-400 hover:text-slate-600"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
            <span className="text-[10px] font-bold">Catat</span>
          </button>

          <button onClick={() => setActiveTab("history")} className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === "history" ? "text-sky-500" : "text-slate-400 hover:text-slate-600"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={activeTab === "history" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" /></svg>
            <span className="text-[10px] font-bold">Riwayat</span>
          </button>
        </div>
      </nav>
    </main>
  );
}
