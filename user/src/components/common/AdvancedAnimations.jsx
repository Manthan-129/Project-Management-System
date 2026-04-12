import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useState, useEffect } from 'react'

/**
 * Advanced Modal Component with Framer Motion
 * Features: Backdrop blur, smooth animations, staggered content
 */
export const AdvancedModal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  }

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.92, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300,
        duration: 0.3,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.92,
      y: 20,
      transition: { duration: 0.2 },
    },
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className={`relative z-10 w-full ${sizeClasses[size]} surface-premium`}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex-between border-b border-slate-200/50 pb-4">
              <h2 className="text-xl font-bold text-slate-900">{title}</h2>
              {showCloseButton && (
                <motion.button
                  onClick={onClose}
                  className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={20} />
                </motion.button>
              )}
            </div>

            {/* Content */}
            <div className="mt-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Page Transition Wrapper
 * Smoothly transitions between pages
 */
export const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full"
    >
      {children}
    </motion.div>
  )
}

/**
 * Stagger Container for animating children in sequence
 */
export const StaggerContainer = ({
  children,
  staggerDelay = 0.1,
  delayChildren = 0,
  className = '',
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delayChildren,
        duration: 0.3,
      },
    },
  }

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  )
}

/**
 * Stagger Item for use inside StaggerContainer
 */
export const StaggerItem = ({ children, className = '' }) => {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', damping: 25, stiffness: 300 },
    },
  }

  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  )
}

/**
 * Dropdown Menu Animation
 */
export const AnimatedDropdown = ({ isOpen, children, align = 'left' }) => {
  const dropdownVariants = {
    hidden: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      pointerEvents: 'none',
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      pointerEvents: 'auto',
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300,
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      pointerEvents: 'none',
      transition: { duration: 0.15 },
    },
  }

  const alignClass = align === 'right' ? 'origin-top-right' : 'origin-top-left'

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`surface-premium absolute top-full mt-2 w-48 ${alignClass}`}
          variants={dropdownVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Toast Notification with Framer Motion
 */
export const AnimatedToast = ({ message, type = 'info', onClose }) => {
  const toastVariants = {
    hidden: {
      opacity: 0,
      x: 100,
      y: -20,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300,
      },
    },
    exit: {
      opacity: 0,
      x: 100,
      y: -20,
      transition: { duration: 0.2 },
    },
  }

  const typeClasses = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  return (
    <motion.div
      className={`rounded-xl border px-4 py-3 shadow-lg ${typeClasses[type]}`}
      variants={toastVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onAnimationComplete={(definition) => {
        if (definition === 'exit') onClose?.()
      }}
    >
      <p className="text-sm font-medium">{message}</p>
    </motion.div>
  )
}

/**
 * Skeleton Loader with Shimmer Animation
 */
export const SkeletonLoader = ({ count = 1, height = 'h-12', className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className={`${height} shimmer-loader rounded-lg`}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

/**
 * Hover Scale Card Animation
 */
export const HoverScaleCard = ({ children, className = '' }) => {
  return (
    <motion.div
      className={`card-premium cursor-pointer ${className}`}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Gradient Animated Text
 */
export const AnimatedGradientText = ({ text, className = '' }) => {
  return (
    <motion.div
      className={`text-gradient animate-gradient font-bold ${className}`}
      style={{
        backgroundSize: '200% 200%',
      }}
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      }}
      transition={{
        duration: 6,
        ease: 'easeInOut',
        repeat: Infinity,
      }}
    >
      {text}
    </motion.div>
  )
}

/**
 * Count Up Animation
 */
export const CountUpAnimation = ({ from = 0, to = 100, duration = 2 }) => {
  const [count, setCount] = useState(from)

  useEffect(() => {
    const increment = (to - from) / (duration * 60)
    let current = from
    const timer = setInterval(() => {
      current += increment
      if (current >= to) {
        setCount(to)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, 1000 / 60)

    return () => clearInterval(timer)
  }, [from, to, duration])

  return <motion.span>{Math.floor(count)}</motion.span>
}

/**
 * Popup Notification with Animation
 */
export const PopupNotification = ({
  isOpen,
  title,
  message,
  action,
  actionLabel = 'Action',
  onClose,
  type = 'info',
}) => {
  const bgGradient = {
    success: 'from-emerald-600 to-teal-600',
    error: 'from-red-600 to-orange-600',
    warning: 'from-amber-600 to-orange-600',
    info: 'from-blue-600 to-indigo-600',
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed bottom-6 right-6 z-50"
          initial={{ opacity: 0, x: 100, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 100, y: 20 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <motion.div
            className={`surface-premium bg-gradient-to-r ${bgGradient[type]} text-white p-6 max-w-sm`}
            layout
          >
            <div className="flex-between mb-2">
              <h3 className="font-semibold">{title}</h3>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <X size={18} />
              </motion.button>
            </div>
            <p className="text-sm opacity-90 mb-4">{message}</p>
            {action && (
              <motion.button
                onClick={action}
                className="mt-3 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {actionLabel}
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Rotating Icon Animation
 */
export const RotatingIcon = ({ children, speed = 2 }) => {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Pulse Animation Wrapper
 */
export const PulseAnimation = ({ children, className = '' }) => {
  return (
    <motion.div
      className={className}
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Slide In Animation
 */
export const SlideInAnimation = ({
  children,
  direction = 'left',
  delay = 0,
  className = '',
}) => {
  const directions = {
    left: { x: -50, opacity: 0 },
    right: { x: 50, opacity: 0 },
    up: { y: 50, opacity: 0 },
    down: { y: -50, opacity: 0 },
  }

  return (
    <motion.div
      className={className}
      initial={directions[direction]}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{
        delay: delay,
        duration: 0.5,
        ease: 'easeOut',
        type: 'spring',
        damping: 20,
      }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Flip Card Animation
 */
export const FlipCard = ({ front, back, className = '' }) => {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <motion.div
      className={`card-premium cursor-pointer ${className}`}
      onClick={() => setIsFlipped(!isFlipped)}
      style={{ perspective: 1000 }}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        style={{
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
        }}
      >
        {!isFlipped ? front : back}
      </motion.div>
    </motion.div>
  )
}

/**
 * Floating Action Button with Animation
 */
export const FloatingActionButton = ({
  icon,
  onClick,
  color = 'indigo',
  position = 'bottom-right',
}) => {
  const colorClasses = {
    indigo: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-indigo-600/40',
    emerald:
      'bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-lg hover:shadow-emerald-600/40',
    red: 'bg-gradient-to-r from-red-600 to-orange-600 hover:shadow-lg hover:shadow-red-600/40',
  }

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  }

  return (
    <motion.button
      className={`fixed z-40 flex-center rounded-full p-4 text-white shadow-lg transition-all ${positionClasses[position]} ${colorClasses[color]}`}
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
    >
      {icon}
    </motion.button>
  )
}