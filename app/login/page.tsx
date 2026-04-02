"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function Login() {
  const router = useRouter();

  // UI States
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form States
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setErrorMsg("Harap isi username dan password Anda.");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password harus terdiri dari minimal 6 karakter.");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const cleanUsername = username.toLowerCase().replace(/\s+/g, "");
    const fakeEmail = `${cleanUsername}@finance.app`;

    try {
      if (!isLoginMode) {
        const { error } = await supabase.auth.signUp({ email: fakeEmail, password });
        if (error) throw error;
        setSuccessMsg("Pendaftaran berhasil. Silakan masuk.");
        setIsLoginMode(true);
        setPassword("");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: fakeEmail, password });
        if (error) throw error;
        router.push("/");
      }
    } catch (error: any) {
      setErrorMsg(
        error.message.includes("credentials") 
          ? "Username atau password tidak valid." 
          : "Terjadi kesalahan sistem. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full max-w-md mx-auto h-screen bg-sky-500 flex flex-col relative sm:border-x sm:border-sky-600 overflow-hidden font-sans">

      {/* BAGIAN ATAS: Branding */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex-1 flex flex-col items-center justify-center p-6 text-white relative z-10"
      >
        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center mb-6 border border-white/30 shadow-2xl">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <h1 className="text-4xl font-black tracking-tighter mb-2">Catatan Uang</h1>
        <p className="text-sky-100 text-sm font-medium text-center opacity-80 leading-relaxed">
          Kelola keuangan harian Anda <br /> Mudah, aman, dan elegan.
        </p>
      </motion.div>

      {/* Ornamen Background */}
      <div className="absolute top-0 left-0 w-full h-1/2 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-sky-400 rounded-full blur-3xl opacity-50"></div>
      </div>

      {/* BAGIAN BAWAH: BUBBLE DRAG BOTTOM SHEET */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.15} // Memungkinkan tarikan membal
        className="bg-white w-full rounded-t-[2.5rem] px-8 pt-4 pb-12 shadow-[0_-20px_50px_rgba(0,0,0,0.15)] relative z-20 flex-shrink-0 cursor-grab active:cursor-grabbing"
        style={{ touchAction: "none" }}
      >
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-black text-slate-900 mb-6 text-center tracking-tight">
            {isLoginMode ? "Masuk ke Akun" : "Daftar Akun Baru"}
          </h2>

          {/* Notifikasi */}
          <AnimatePresence mode="wait">
            {(errorMsg || successMsg) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`mb-4 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
                  errorMsg ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                {errorMsg || successMsg}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleAuth} className="space-y-4" onPointerDown={(e) => e.stopPropagation()}>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
              <input
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 h-14 text-sm font-bold text-slate-900 focus:bg-white focus:border-sky-500 outline-none transition-all placeholder:text-slate-300"
              />
            </div>

            <div className="space-y-1.5 relative">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-5 pr-12 h-14 text-sm font-bold text-slate-900 focus:bg-white focus:border-sky-500 outline-none transition-all placeholder:text-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-sky-500 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white font-black rounded-2xl h-14 mt-6 shadow-[0_8px_25px_rgba(0,0,0,0.1)] active:scale-[0.97] transition-all disabled:opacity-70 flex items-center justify-center gap-2 overflow-hidden tracking-wide"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (isLoginMode ? "MASUK" : "DAFTAR SEKARANG")}
            </button>
          </form>

          <div className="mt-8 text-center text-sm relative z-10">
            <span className="text-slate-400 font-medium">
              {isLoginMode ? "Belum memiliki akun? " : "Sudah memiliki akun? "}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className="font-black text-sky-500 active:text-sky-700 transition-colors"
            >
              {isLoginMode ? "DAFTAR" : "MASUK"}
            </button>
          </div>
        </motion.div>

        {/* EKOR SILUMAN: Menutupi background saat form ditarik ke atas */}
        <div className="absolute top-full -mt-1 left-0 w-full h-[50vh] bg-white pointer-events-none"></div>
      </motion.div>
    </main>
  );
}
