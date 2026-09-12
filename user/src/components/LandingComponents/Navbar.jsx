import { Menu, Sparkles, X } from 'lucide-react'
import { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppContext } from '../../context/AppContext.jsx'

const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Collaboration', href: '#collaboration' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Progress', href: '#tracking' },
]

const Navbar = () => {
    const { token, logout } = useContext(AppContext);
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-[0_2px_15px_rgba(15,23,42,0.04)]">
            <div className="mx-auto max-w-7xl px-5 lg:px-12">
                <div className="flex h-16 items-center justify-between gap-6">

                    <Link to="/" className="flex items-center gap-2.5 no-underline" aria-label="Go to home page">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-xs">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <h1 className="text-base font-bold tracking-tight leading-tight text-slate-900">
                                Dev<span className="text-indigo-600">Dash</span>
                            </h1>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] leading-none text-slate-500">Project Management</p>
                        </div>
                    </Link>

                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-700 no-underline"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    <div className="hidden md:flex items-center gap-2.5">
                        {token ? (
                            <>
                                <Link
                                    to="/dashboard"
                                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 no-underline shadow-xs"
                                >
                                    Dashboard
                                </Link>
                                <button
                                    onClick={logout}
                                    className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-bold text-white shadow-xs"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 no-underline shadow-xs"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/signup"
                                    className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-bold text-white shadow-xs no-underline"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-expanded={mobileOpen}
                        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                        className="md:hidden rounded-xl border border-slate-300 bg-white p-2 text-slate-700"
                    >
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {mobileOpen && (
                    <div className="md:hidden space-y-1 border-t border-slate-200 bg-white/95 backdrop-blur-xl py-4">
                        {navLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                onClick={() => setMobileOpen(false)}
                                className="block rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 no-underline"
                            >
                                {link.label}
                            </a>
                        ))}
                        <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 px-4 pt-3">
                            {token ? (
                                <>
                                    <Link
                                        to="/dashboard"
                                        onClick={() => setMobileOpen(false)}
                                        className="w-full rounded-xl border border-slate-300 bg-white py-2.5 text-center text-sm font-bold text-slate-800 no-underline shadow-xs"
                                    >
                                        Dashboard
                                    </Link>
                                    <button
                                        onClick={() => { setMobileOpen(false); logout(); }}
                                        className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-2.5 text-center text-sm font-bold text-white shadow-xs"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        onClick={() => setMobileOpen(false)}
                                        className="w-full rounded-xl border border-slate-300 bg-white py-2.5 text-center text-sm font-bold text-slate-800 no-underline shadow-xs"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        to="/signup"
                                        onClick={() => setMobileOpen(false)}
                                        className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-2.5 text-center text-sm font-bold text-white shadow-xs no-underline"
                                    >
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
