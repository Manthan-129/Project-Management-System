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
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? (isDarkTheme ? 'border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl shadow-[0_10px_30px_rgba(2,6,23,0.5)]' : 'border-b border-slate-200/80 bg-white/85 backdrop-blur-xl shadow-[0_4px_20px_rgba(15,23,42,0.04)]') : 'bg-transparent'}`}>
        <div className="mx-auto max-w-7xl px-5 lg:px-12">
            <div className="flex h-16 items-center justify-between gap-6">

                <Link to="/" className="flex items-center gap-2.5 no-underline" aria-label="Go to home page">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20">
                        <Sparkles size={18} />
                    </div>
                    <div>
                        <h1 className={`text-base font-bold tracking-tight leading-tight ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                            Dev<span className="text-indigo-600 dark:text-indigo-400">Dash</span>
                        </h1>
                        <p className={`text-[10px] font-medium uppercase tracking-[0.2em] leading-none ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>Project Management</p>
                    </div>
                </Link>

                <div className="hidden md:flex items-center gap-1">
                    {navLinks.map((link)=>(
                        <a key={link.label} href={link.href}
                            className={`rounded-xl px-3.5 py-2 text-sm font-medium transition-colors no-underline ${isDarkTheme ? 'text-slate-300 hover:bg-slate-800 hover:text-indigo-400' : 'text-slate-600 hover:bg-slate-100/80 hover:text-indigo-600'}`}>
                            {link.label}
                        </a>
                    ))}
                </div>

                <div className="hidden md:flex items-center gap-2">
                    {token ? (
                        <>
                            <Link to="/dashboard" className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors no-underline ${isDarkTheme ? 'border-slate-800 text-slate-200 hover:bg-slate-900' : 'border-slate-200 text-slate-700 hover:bg-slate-100/70'}`}>
                                Dashboard
                            </Link>
                            <button onClick={logout} className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:from-indigo-600 hover:to-violet-700 active:scale-[0.99]">
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors no-underline ${isDarkTheme ? 'border-slate-800 text-slate-200 hover:bg-slate-900' : 'border-slate-200 text-slate-700 hover:bg-slate-100/70'}`}>
                                Sign In
                            </Link>
                            <Link to="/signup" className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all no-underline hover:from-indigo-600 hover:to-violet-700 active:scale-[0.99]">
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>

                <button onClick={()=> setMobileOpen(!mobileOpen)}
                    aria-expanded={mobileOpen}
                    aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                    className={`md:hidden rounded-xl border p-2 transition-colors ${isDarkTheme ? 'border-slate-800 text-slate-300 hover:bg-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                    {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {mobileOpen && (
                <div className={`md:hidden space-y-1 border-t py-4 backdrop-blur-xl ${isDarkTheme ? 'border-slate-800 bg-slate-950/95' : 'border-slate-200 bg-white/95'}`}>
                    {navLinks.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className={`block rounded-xl px-4 py-2.5 text-sm font-medium no-underline transition-colors ${isDarkTheme ? 'text-slate-300 hover:bg-slate-800 hover:text-indigo-400' : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-600'}`}
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
                                <button onClick={() => { setMobileOpen(false); logout(); }} className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-2.5 text-center text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:from-indigo-600 hover:to-violet-700">
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" onClick={() => setMobileOpen(false)} className={`w-full rounded-xl border py-2.5 text-center text-sm font-semibold no-underline transition-colors ${isDarkTheme ? 'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
                                    Sign In
                                </Link>
                                <Link to="/signup" onClick={() => setMobileOpen(false)} className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-2.5 text-center text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:from-indigo-600 hover:to-violet-700">
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
