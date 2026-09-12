import { Github, Linkedin, Mail, Sparkles, Twitter } from 'lucide-react'
import { useContext } from 'react'
import { AppContext } from '../../context/AppContext.jsx'

const socialLinks = [
  { label: 'GitHub', href: 'https://github.com', icon: <Github size={16} /> },
  { label: 'Twitter', href: 'https://x.com', icon: <Twitter size={16} /> },
  { label: 'LinkedIn', href: 'https://www.linkedin.com', icon: <Linkedin size={16} /> },
  { label: 'Email', href: 'mailto:support@devdash.app', icon: <Mail size={16} /> },
]

const footerLinks = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Collaboration', href: '#collaboration' },
      { label: 'Progress', href: '#tracking' },
      { label: 'Testimonials', href: '#testimonials' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '#stats' },
      { label: 'Sign In', href: '/login' },
      { label: 'Sign Up', href: '/signup' },
      { label: 'Contact', href: '#site-footer' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'Demo Board', href: '#kanban-preview' },
      { label: 'Security Settings', href: '/settings/security' },
      { label: 'System Status', href: '#stats' },
    ],
  },
]

const Footer = () => {
  const { token, logout } = useContext(AppContext)

  const companyLinks = token
    ? [
        { label: 'About', href: '#stats' },
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Logout', action: logout },
        { label: 'Contact', href: '#site-footer' },
      ]
    : [
        { label: 'About', href: '#stats' },
        { label: 'Sign In', href: '/login' },
        { label: 'Sign Up', href: '/signup' },
        { label: 'Contact', href: '#site-footer' },
      ]

  return (
    <footer id="site-footer" className="border-t border-slate-800/80 bg-slate-950 px-5 py-16 lg:px-12">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-xs">
                <Sparkles size={18} />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Dev<span className="text-indigo-400">Dash</span>
              </h2>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed">
              A calm, focused platform for teams that want stronger execution from planning to pull request delivery.
            </p>

            <div className="flex gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition-all hover:border-indigo-500 hover:bg-indigo-600 hover:text-white"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {footerLinks.map((col) => {
            const links = col.heading === 'Company' ? companyLinks : col.links

            return (
            <div key={col.heading} className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">{col.heading}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.action ? (
                      <button onClick={link.action} className="text-sm text-slate-400 transition-colors hover:text-indigo-300">
                        {link.label}
                      </button>
                    ) : (
                      <a href={link.href} className="text-sm text-slate-400 transition-colors hover:text-indigo-300 no-underline">
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )})}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-800/80">
          <p className="text-xs text-slate-500">Copyright 2026 DevDash. All rights reserved.</p>
          <div className="flex gap-5">
            <a href="/settings/privacy" className="text-xs text-slate-400 hover:text-indigo-300 transition-colors no-underline">
              Privacy Policy
            </a>
            <a href="mailto:support@devdash.app?subject=Terms%20of%20Service" className="text-xs text-slate-400 hover:text-indigo-300 transition-colors no-underline">
              Terms of Service
            </a>
            <a href="mailto:support@devdash.app?subject=Cookie%20Policy" className="text-xs text-slate-400 hover:text-indigo-300 transition-colors no-underline">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
