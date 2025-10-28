"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "#3b82f6",
          "--normal-text": "#ffffff",
          "--normal-border": "#1d4ed8",
          "--success-bg": "linear-gradient(135deg, #e0f2fe, #bae6fd)",
          "--success-text": "#1e293b",
          "--error-bg": "#ef4444",
          "--error-text": "#ffffff",
        } as React.CSSProperties
      }
      toastOptions={{
        style: {
          backdropFilter: 'none',
          backgroundColor: 'var(--normal-bg)',
          color: 'var(--normal-text)',
          border: '1px solid var(--normal-border)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          opacity: 1,
        },
        classNames: {
          toast: 'toaster__toast',
          description: 'toaster__description',
          title: 'toaster__title',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
