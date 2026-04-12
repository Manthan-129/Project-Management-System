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

    useEffect(()=>{
        const handleScroll= ()=> setScrolled(window.scrollY > 10)
        window.addEventListener('scroll', handleScroll)
        return ()=> window.removeEventListener('scroll', handleScroll)
    },[]);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'border-b border-white/70 bg-white/75 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.08)]' : 'bg-transparent'}`}>
        <div className="mx-auto max-w-7xl px-5 lg:px-12">
            <div className="flex h-16 items-center justify-between gap-6">

                <Link to="/" className="flex items-center gap-2.5 no-underline" aria-label="Go to home page">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#315e8d] to-[#26486d] shadow-lg shadow-blue-950/10">
                        <Sparkles size={18} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-base font-black tracking-tight text-slate-900 leading-tight">Dev<span className="text-[#315e8d]">Dash</span></h1>
                        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500 leading-none">Project Management</p>
                    </div>
                </Link>

                <div className="hidden md:flex items-center gap-1">
                    {navLinks.map((link)=>(
                        <a key={link.label} href={link.href}
                            className="rounded-xl px-3.5 py-2 text-sm text-slate-600 transition-colors no-underline hover:bg-slate-100 hover:text-[#26486d]">
                            {link.label}
                        </a>
                    ))}
                </div>

                <div className="hidden md:flex items-center gap-2">
                    {token ? (
                        <>
                            <Link to="/dashboard" className="rounded-xl border border-transparent px-4 py-2 text-sm font-semibold text-slate-700 transition-colors no-underline hover:border-slate-200 hover:bg-white hover:text-slate-900">
                                Dashboard
                            </Link>
                            <button onClick={logout} className="rounded-xl bg-gradient-to-r from-[#315e8d] to-[#26486d] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-950/10 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-950/15">
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="rounded-xl border border-transparent px-4 py-2 text-sm font-semibold text-slate-700 transition-colors no-underline hover:border-slate-200 hover:bg-white hover:text-slate-900">
                                Sign In
                            </Link>
                            <Link to="/signup" className="rounded-xl bg-gradient-to-r from-[#315e8d] to-[#26486d] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-950/10 transition-all no-underline hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-950/15">
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>

                <button onClick={()=> setMobileOpen(!mobileOpen)}
                    aria-expanded={mobileOpen}
                    aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                    className="md:hidden rounded-xl border border-transparent p-2 text-slate-600 transition-colors hover:border-slate-200 hover:bg-white hover:text-slate-900">
                    {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {mobileOpen && (
                <div className="md:hidden space-y-1 border-t border-slate-200 bg-white/90 py-4 backdrop-blur-xl">
                    {navLinks.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className="block rounded-xl px-4 py-2.5 text-sm text-slate-600 no-underline transition-colors hover:bg-slate-100 hover:text-[#26486d]"
                        >
                            {link.label}
                        </a>
                    ))}
                    <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 px-4 pt-3">
                        {token ? (
                            <>
                                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-center text-sm font-semibold text-slate-700 no-underline transition-colors hover:bg-slate-50">
                                    Dashboard
                                </Link>
                                <button onClick={() => { setMobileOpen(false); logout(); }} className="w-full rounded-xl bg-gradient-to-r from-[#315e8d] to-[#26486d] py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-blue-950/10 no-underline transition-all hover:-translate-y-0.5">
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" onClick={() => setMobileOpen(false)} className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-center text-sm font-semibold text-slate-700 no-underline transition-colors hover:bg-slate-50">
                                    Sign In
                                </Link>
                                <Link to="/signup" onClick={() => setMobileOpen(false)} className="w-full rounded-xl bg-gradient-to-r from-[#315e8d] to-[#26486d] py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-blue-950/10 no-underline transition-all hover:-translate-y-0.5">
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
