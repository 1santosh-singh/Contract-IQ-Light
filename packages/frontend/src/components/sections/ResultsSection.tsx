/**
 * Results section component with animated counters
 */
import React from 'react'
import { Check, FileText, Zap, Globe } from 'lucide-react'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'

interface StatCardProps {
  icon: React.ReactNode
  value: React.ReactNode
  label: string
  description: string
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, description }) => (
  <div className="bg-white/80 dark:bg-gray-900/80 rounded-lg p-6 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 border border-border dark:border-white">
    <div className="flex justify-center mb-4">
      {icon}
    </div>
    <div className="text-3xl font-bold text-primary dark:text-white mb-2">
      {value}
    </div>
    <p className="text-sm text-muted-foreground dark:text-white font-medium mb-1">
      {label}
    </p>
    <p className="text-xs text-muted-foreground dark:text-white">
      {description}
    </p>
  </div>
)

export const ResultsSection: React.FC = () => {
  const stats = [
    {
      icon: <Check className="h-8 w-8 text-blue-600 dark:text-blue-400" />,
      value: <><AnimatedCounter target={99} />%+</>,
      label: "Accuracy",
      description: "Reliable clause risk detection and summarization"
    },
    {
      icon: <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />,
      value: <><AnimatedCounter target={80} />K+</>,
      label: "Contracts Processed",
      description: "From startups to enterprises worldwide"
    },
    {
      icon: <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" />,
      value: <><span>{'< '}</span><AnimatedCounter target={5} /> Seconds</>,
      label: "Analysis",
      description: "Rapid insights, no waiting around"
    },
    {
      icon: <Globe className="h-8 w-8 text-blue-600 dark:text-blue-400" />,
      value: <><AnimatedCounter target={20} />+</>,
      label: "Industries",
      description: "Versatile solutions across legal, finance, and corporate sectors"
    }
  ]

  return (
    <section className="py-24 mx-0 px-4 sm:px-6 bg-gradient-to-b from-blue-200 to-indigo-100 dark:from-blue-950 dark:to-blue-900 section">
      <div className="max-w-7xl mx-auto text-center">
        <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full px-4 py-2 text-sm font-medium mb-6">
          Trusted Outcomes
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground dark:text-white mb-4">
          Results That Speak for Themselves
        </h2>
        <p className="text-lg text-muted-foreground dark:text-white max-w-2xl mx-auto mb-16">
          Our AI-powered platform consistently delivers clarity, efficiency, and confidence in legal decision-making.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              icon={stat.icon}
              value={stat.value}
              label={stat.label}
              description={stat.description}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
