import { Github, Linkedin, Mail, Sparkles, Twitter, ArrowRight } from 'lucide-react'
import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppContext } from '../../context/AppContext.jsx'
import { StaggerContainer, StaggerItem } from '../common/AdvancedAnimations'

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', damping: 25, stiffness: 300 },
    },
  }

  const linkHoverVariants = {
    rest: { x: 0 },
    hover: { x: 6, transition: { type: 'spring', damping: 12 } },
  }

  return (
    <footer
      id="site-footer"
      className="relative border-t border-white/5 bg-gradient-to-b from-slate-900 via-slate-950 to-black px-5 py-20 lg:px-12 overflow-hidden"
    >
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-full blur-3xl"
          animate={{ y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-600/20 to-cyan-600/20 rounded-full blur-3xl"
          animate={{ y: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-16">
        {/* Main Footer Content */}
        <motion.div
          className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          {/* Brand Section */}
          <motion.div className="space-y-6" variants={itemVariants}>
            <motion.div
              className="inline-block"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-600/30 group"
                  whileHover={{ scale: 1.1, rotate: 12 }}
                >
                  <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}>
                    <Sparkles size={20} className="text-white" />
                  </motion.div>
                </motion.div>
                <h2 className="text-xl font-black bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Dev<span className="text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text">Dash</span>
                </h2>
              </div>
            </motion.div>

            <motion.p className="text-sm leading-relaxed text-slate-400 max-w-xs" variants={itemVariants}>
              A calm, focused platform for teams that want stronger execution from planning to pull request delivery.
            </motion.p>

            {/* Social Links */}
            <motion.div className="flex gap-3 pt-4" variants={itemVariants}>
              <StaggerContainer staggerDelay={0.08}>
                {socialLinks.map((social) => (
                  <StaggerItem key={social.label}>
                    <motion.a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 text-slate-400 transition-colors backdrop-blur-sm border border-white/5 hover:text-white hover:bg-gradient-to-br hover:from-indigo-600/20 hover:to-purple-600/20 hover:border-indigo-400/30"
                      whileHover={{ scale: 1.15, y: -4 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {social.icon}
                    </motion.a>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </motion.div>
          </motion.div>

          {/* Links Sections */}
          {footerLinks.map((col, idx) => (
            <motion.div key={col.heading} className="space-y-6" variants={itemVariants}>
              <motion.h3
                className="text-xs font-bold uppercase tracking-widest text-slate-300"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                {col.heading}
              </motion.h3>
              <StaggerContainer staggerDelay={0.06}>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <StaggerItem key={link.label}>
                      <motion.div variants={linkHoverVariants} initial="rest" whileHover="hover">
                        {link.href?.startsWith('/') ? (
                          <Link
                            to={link.href}
                            className="group flex items-center gap-2 text-sm text-slate-400 no-underline transition-colors hover:text-indigo-400"
                          >
                            {link.label}
                            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        ) : (
                          <a
                            href={link.href}
                            className="group flex items-center gap-2 text-sm text-slate-400 no-underline transition-colors hover:text-indigo-400"
                          >
                            {link.label}
                            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        )}
                      </motion.div>
                    </StaggerItem>
                  ))}
                </ul>
              </StaggerContainer>
            </motion.div>
          ))}

          {/* Company Section */}
          <motion.div className="space-y-6" variants={itemVariants}>
            <motion.h3
              className="text-xs font-bold uppercase tracking-widest text-slate-300"
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              Company
            </motion.h3>
            <StaggerContainer staggerDelay={0.06}>
              <ul className="space-y-3">
                {companyLinks.map((link) => (
                  <StaggerItem key={link.label}>
                    <motion.div variants={linkHoverVariants} initial="rest" whileHover="hover">
                      {'action' in link ? (
                        <motion.button
                          onClick={link.action}
                          className="group flex items-center gap-2 bg-transparent text-sm text-slate-400 no-underline transition-colors hover:text-indigo-400 w-full text-left"
                          whileHover={{ x: 6 }}
                        >
                          {link.label}
                          <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.button>
                      ) : link.href?.startsWith('/') ? (
                        <Link
                          to={link.href}
                          className="group flex items-center gap-2 text-sm text-slate-400 no-underline transition-colors hover:text-indigo-400"
                        >
                          {link.label}
                          <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          className="group flex items-center gap-2 text-sm text-slate-400 no-underline transition-colors hover:text-indigo-400"
                        >
                          {link.label}
                          <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      )}
                    </motion.div>
                  </StaggerItem>
                ))}
              </ul>
            </StaggerContainer>
          </motion.div>
        </motion.div>

        {/* Bottom Footer */}
        <motion.div
          className="flex flex-col items-center justify-between gap-6 border-t border-white/5 pt-12 sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <motion.p className="text-xs text-slate-500" whileHover={{ textShadow: '0 0 12px rgba(99, 102, 241, 0.3)' }}>
            Copyright © 2026 DevDash. All rights reserved.
          </motion.p>
          <motion.div className="flex flex-wrap items-center justify-center gap-6">
            {[
              { label: 'Privacy Policy', href: '/settings/privacy' },
              { label: 'Terms of Service', href: 'mailto:support@devdash.app?subject=Terms%20of%20Service' },
              { label: 'Cookie Policy', href: 'mailto:support@devdash.app?subject=Cookie%20Policy' },
            ].map((link, idx) => (
              <motion.a
                key={link.label}
                href={link.href}
                className="text-xs text-slate-500 no-underline transition-colors hover:text-indigo-400"
                whileHover={{ scale: 1.05, x: 4 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
              >
                {link.label}
              </motion.a>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </footer>
  )
}

export default Footer
