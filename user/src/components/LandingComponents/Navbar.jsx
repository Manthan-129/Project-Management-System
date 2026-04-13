import { Menu, Sparkles, X } from 'lucide-react'
import { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppContext } from '../../context/AppContext.jsx'

const navLinks= [
    {label: 'Features', href: '#features'},
    {label: 'Collaboration', href: '#collaboration'},
    {label: 'How It Works', href: '#how-it-works'},
    {label: 'Progress', href: '#tracking'},
]

const Navbar = () => {
    const { token, logout } = useContext(AppContext);

    const [scrolled, setScrolled]= useState(false);
    const [mobileOpen, setMobileOpen]= useState(false);
    const [resolvedTheme, setResolvedTheme] = useState('light');

    useEffect(()=>{
        const handleScroll= ()=> setScrolled(window.scrollY > 10)
        window.addEventListener('scroll', handleScroll)
        return ()=> window.removeEventListener('scroll', handleScroll)
    },[]);

    const getResolvedTheme = () => {
        if (typeof window === 'undefined') return 'light';
        const savedTheme = localStorage.getItem('theme') || 'system';

        if (savedTheme === 'system') {
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }

        return savedTheme;
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const updateTheme = () => {
            setResolvedTheme(getResolvedTheme());
        };

        const handleStorageChange = (event) => {
            if (!event.key || event.key === 'theme') {
                updateTheme();
            }
        };

        updateTheme();
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('app:theme-change', updateTheme);

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', updateTheme);
        } else {
            mediaQuery.addListener(updateTheme);
        }

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('app:theme-change', updateTheme);

            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', updateTheme);
            } else {
                mediaQuery.removeListener(updateTheme);
            }
        };
    }, []);

    const isDarkTheme = resolvedTheme === 'dark';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? (isDarkTheme ? 'border-b border-slate-700/70 bg-slate-950/70 backdrop-blur-xl shadow-[0_10px_40px_rgba(2,6,23,0.45)]' : 'border-b border-white/70 bg-white/75 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.08)]') : 'bg-transparent'}`}>
        <div className="mx-auto max-w-7xl px-5 lg:px-12">
            <div className="flex h-16 items-center justify-between gap-6">

                <Link to="/" className="flex items-center gap-2.5 no-underline" aria-label="Go to home page">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl shadow-lg ${isDarkTheme ? 'bg-cyan-500/20 shadow-cyan-950/20' : 'bg-gradient-to-br from-[#315e8d] to-[#26486d] shadow-blue-950/10'}`}>
                        <Sparkles size={18} className="text-white" />
                    </div>
                    <div>
                        <h1 className={`text-base font-black tracking-tight leading-tight ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Dev<span className={isDarkTheme ? 'text-cyan-300' : 'text-[#315e8d]'}>Dash</span></h1>
                        <p className={`text-[11px] font-medium uppercase tracking-[0.22em] leading-none ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>Project Management</p>
                    </div>
                </Link>

                <div className="hidden md:flex items-center gap-1">
                    {navLinks.map((link)=>(
                        <a key={link.label} href={link.href}
                            className={`rounded-xl px-3.5 py-2 text-sm transition-colors no-underline ${isDarkTheme ? 'text-slate-300 hover:bg-slate-800 hover:text-cyan-300' : 'text-slate-600 hover:bg-slate-100 hover:text-[#26486d]'}`}>
                            {link.label}
                        </a>
                    ))}
                </div>

                <div className="hidden md:flex items-center gap-2">
                    {token ? (
                        <>
                            <Link to="/dashboard" className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors no-underline ${isDarkTheme ? 'border-transparent text-slate-200 hover:border-slate-700 hover:bg-slate-900 hover:text-white' : 'border-transparent text-slate-700 hover:border-slate-200 hover:bg-white hover:text-slate-900'}`}>
                                Dashboard
                            </Link>
                            <button onClick={logout} className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 ${isDarkTheme ? 'bg-cyan-500 hover:bg-cyan-400 shadow-lg shadow-cyan-950/20 hover:shadow-xl hover:shadow-cyan-950/25' : 'bg-gradient-to-r from-[#315e8d] to-[#26486d] shadow-lg shadow-blue-950/10 hover:shadow-xl hover:shadow-blue-950/15'}`}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors no-underline ${isDarkTheme ? 'border-transparent text-slate-200 hover:border-slate-700 hover:bg-slate-900 hover:text-white' : 'border-transparent text-slate-700 hover:border-slate-200 hover:bg-white hover:text-slate-900'}`}>
                                Sign In
                            </Link>
                            <Link to="/signup" className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all no-underline hover:-translate-y-0.5 ${isDarkTheme ? 'bg-cyan-500 hover:bg-cyan-400 shadow-lg shadow-cyan-950/20 hover:shadow-xl hover:shadow-cyan-950/25' : 'bg-gradient-to-r from-[#315e8d] to-[#26486d] shadow-lg shadow-blue-950/10 hover:shadow-xl hover:shadow-blue-950/15'}`}>
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>

                <button onClick={()=> setMobileOpen(!mobileOpen)}
                    aria-expanded={mobileOpen}
                    aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                    className={`md:hidden rounded-xl border p-2 transition-colors ${isDarkTheme ? 'border-transparent text-slate-300 hover:border-slate-700 hover:bg-slate-900 hover:text-white' : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-900'}`}>
                    {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {mobileOpen && (
                <div className={`md:hidden space-y-1 border-t py-4 backdrop-blur-xl ${isDarkTheme ? 'border-slate-700 bg-slate-950/90' : 'border-slate-200 bg-white/90'}`}>
                    {navLinks.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className={`block rounded-xl px-4 py-2.5 text-sm no-underline transition-colors ${isDarkTheme ? 'text-slate-300 hover:bg-slate-800 hover:text-cyan-300' : 'text-slate-600 hover:bg-slate-100 hover:text-[#26486d]'}`}
                        >
                            {link.label}
                        </a>
                    ))}
                    <div className={`mt-2 flex flex-col gap-2 border-t px-4 pt-3 ${isDarkTheme ? 'border-slate-800' : 'border-slate-100'}`}>
                        {token ? (
                            <>
                                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className={`w-full rounded-xl border py-2.5 text-center text-sm font-semibold no-underline transition-colors ${isDarkTheme ? 'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
                                    Dashboard
                                </Link>
                                <button onClick={() => { setMobileOpen(false); logout(); }} className={`w-full rounded-xl py-2.5 text-center text-sm font-semibold text-white shadow-lg no-underline transition-all hover:-translate-y-0.5 ${isDarkTheme ? 'bg-cyan-500 hover:bg-cyan-400 shadow-cyan-950/20' : 'bg-gradient-to-r from-[#315e8d] to-[#26486d] shadow-blue-950/10'}`}>
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" onClick={() => setMobileOpen(false)} className={`w-full rounded-xl border py-2.5 text-center text-sm font-semibold no-underline transition-colors ${isDarkTheme ? 'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
                                    Sign In
                                </Link>
                                <Link to="/signup" onClick={() => setMobileOpen(false)} className={`w-full rounded-xl py-2.5 text-center text-sm font-semibold text-white shadow-lg no-underline transition-all hover:-translate-y-0.5 ${isDarkTheme ? 'bg-cyan-500 hover:bg-cyan-400 shadow-cyan-950/20' : 'bg-gradient-to-r from-[#315e8d] to-[#26486d] shadow-blue-950/10'}`}>
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    </nav>
  )
}

export default Navbar
