import React, { useEffect, useState } from 'react'
import { Menu, Sparkles, X } from 'lucide-react'

const navLinks= [
    {label: 'Features', href: '#features'},
    {label: 'Collaboration', href: '#collaboration'},
    {label: 'How It Works', href: '#how-it-works'},
]

const Navbar = () => {

    const [scrolled, setScrolled]= useState(false);
    const [mobileOpen, setMobileOpen]= useState(false);

    useEffect(()=>{
        const handleScroll= ()=> setScrolled(window.scrollY > 10)
        window.addEventListener('scroll', handleScroll)
        return ()=> window.removeEventListener('scroll', handleScroll)
    },[]);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#f5f8fc]/95 backdrop-blur-xl border-b border-slate-200/80' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-5 lg:px-12">
            <div className="flex items-center justify-between h-16 gap-6">

                <a href="#" className="flex items-center gap-2.5 no-underline">
                    <div className="p-1.5 bg-[#e8f0fa] rounded-lg border border-[#d9e5f4]">
                        <Sparkles size={18} className="text-[#315e8d]" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-slate-900 leading-tight">Dev<span className="text-[#315e8d]">Dash</span></h1>
                        <p className="text-[11px] text-slate-500 leading-none">Project Management</p>
                    </div>
                </a>

                <div className="hidden md:flex items-center gap-1">
                    {navLinks.map((link)=>(
                        <a key={link.label} href={link.href}
                            className="px-3.5 py-2 text-sm text-slate-600 hover:text-[#26486d] hover:bg-[#e7eef7] rounded-lg transition-colors no-underline">
                            {link.label}
                        </a>
                    ))}
                </div>

                <div className="hidden md:flex items-center gap-2">
                    <button className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-slate-200">
                        Sign In
                    </button>
                    <button className="px-4 py-2 text-sm font-semibold text-white bg-[#315e8d] hover:bg-[#26486d] rounded-xl shadow-sm transition-colors">
                        Sign Up
                    </button>
                </div>

                <button onClick={()=> setMobileOpen(!mobileOpen)}
                    className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200">
                    {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {mobileOpen && (
                <div className="md:hidden border-t border-slate-200 py-4 space-y-1 bg-[#f5f8fc]">
                    {navLinks.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className="block px-4 py-2.5 text-sm text-slate-600 hover:text-[#26486d] hover:bg-[#e7eef7] rounded-xl transition-colors no-underline"
                        >
                            {link.label}
                        </a>
                    ))}
                    <div className="flex flex-col gap-2 pt-3 px-4 border-t border-slate-100 mt-2">
                        <button className="w-full py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors">
                            Sign In
                        </button>
                        <button className="w-full py-2.5 text-sm font-semibold text-white bg-[#315e8d] hover:bg-[#26486d] rounded-xl shadow-sm transition-colors">
                            Sign Up
                        </button>
                    </div>
                </div>
            )}
        </div>
    </nav>
  )
}

export default Navbar
