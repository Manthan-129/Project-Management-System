import { Github, Linkedin, Mail, Sparkles, Twitter } from 'lucide-react'

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
  return (
    <footer id="site-footer" className="bg-[#0f1f34] px-5 py-16 lg:px-12">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-[#1c3555] rounded-lg border border-[#2c4b71]">
                <Sparkles size={18} className="text-[#8fb2d9]" />
              </div>
              <h2 className="text-lg font-bold text-white">
                Dev<span className="text-[#8fb2d9]">Dash</span>
              </h2>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
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
                  className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-white bg-[#1b314d] hover:bg-[#315e8d] rounded-lg transition-colors"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {footerLinks.map((col) => (
            <div key={col.heading} className="space-y-4">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest">{col.heading}</h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-slate-300 hover:text-white transition-colors no-underline">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-[#2b4567]">
          <p className="text-xs text-slate-300">Copyright 2026 DevDash. All rights reserved.</p>
          <div className="flex gap-5">
            <a href="/settings/privacy" className="text-xs text-slate-300 hover:text-white transition-colors no-underline">
              Privacy Policy
            </a>
            <a href="mailto:support@devdash.app?subject=Terms%20of%20Service" className="text-xs text-slate-300 hover:text-white transition-colors no-underline">
              Terms of Service
            </a>
            <a href="mailto:support@devdash.app?subject=Cookie%20Policy" className="text-xs text-slate-300 hover:text-white transition-colors no-underline">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
