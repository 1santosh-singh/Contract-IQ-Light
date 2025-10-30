"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      duration={2000}
      style={
        {
          "--normal-bg": theme === "dark" ? "rgba(0, 0, 0, 0.2)" : "rgba(255, 255, 255, 0.2)",
          "--normal-text": theme === "dark" ? "#ffffff" : "#1f2937",
          "--normal-border": theme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)",
          "--success-bg": theme === "dark" ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.2)",
          "--success-text": theme === "dark" ? "#ffffff" : "#000000",
          "--error-bg": theme === "dark" ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.2)",
          "--error-text": theme === "dark" ? "#ffffff" : "#000000",
        } as React.CSSProperties
      }
      toastOptions={{
        style: {
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          backgroundColor: 'var(--normal-bg)',
          color: 'var(--normal-text)',
          border: '1px solid var(--normal-border)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
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
