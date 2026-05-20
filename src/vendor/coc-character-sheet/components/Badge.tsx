import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger'
  className?: string
}

const variants = {
  default: 'bg-coc-surface-light text-coc-text-muted border-coc-border',
  success: 'bg-coc-accent/20 text-coc-accent-light border-coc-accent/30',
  warning: 'bg-coc-warning/20 text-coc-warning border-coc-warning/30',
  danger: 'bg-coc-danger/20 text-coc-danger border-coc-danger/30',
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
