/**
 * アラートコンポーネント
 */

import React from 'react'
import { AlertCircle, CheckCircle, Info, X, XCircle } from 'lucide-react'

export type AlertVariant = 'success' | 'error' | 'warning' | 'info'

interface AlertProps {
  variant?: AlertVariant
  title?: string
  message: string
  onClose?: () => void
  className?: string
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  message,
  onClose,
  className = ''
}) => {
  const variantStyles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: CheckCircle,
      iconColor: 'text-green-600'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: XCircle,
      iconColor: 'text-red-600'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: AlertCircle,
      iconColor: 'text-yellow-600'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: Info,
      iconColor: 'text-blue-600'
    }
  }

  const styles = variantStyles[variant]
  const Icon = styles.icon

  return (
    <div
      className={`${styles.bg} ${styles.border} border rounded-lg p-4 ${className}`}
      role="alert"
    >
      <div className="flex items-start">
        <Icon className={`${styles.iconColor} h-5 w-5 mt-0.5 mr-3 flex-shrink-0`} />
        <div className="flex-1">
          {title && (
            <h3 className={`${styles.text} font-semibold mb-1`}>{title}</h3>
          )}
          <p className={`${styles.text} text-sm`}>{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`${styles.text} ml-4 flex-shrink-0 hover:opacity-75`}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )
}

