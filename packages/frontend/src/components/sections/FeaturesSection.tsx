/**
 * Features section component
 */
import React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { FileText, AlertTriangle, MessageCircle, Search } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  onClick: () => void
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, onClick }) => (
  <div 
    className="bg-gray-50 dark:bg-gray-800/50 text-card-foreground rounded-lg p-8 shadow-sm hover:shadow-lg dark:hover:shadow-black hover:-translate-y-1 transition-all duration-300 border border-border dark:border-white hover:border-accent cursor-pointer"
    onClick={onClick}
  >
    <div className="flex justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-bold mb-2 text-center text-card-foreground dark:text-white">
      {title}
    </h3>
  </div>
)

export const FeaturesSection: React.FC = () => {
  const router = useRouter()
  const { user } = useAuth()

  const handleFeatureClick = (feature: string, route: string) => {
    if (!user) {
      toast.error(`Please log in to use ${feature.toLowerCase()}`)
      router.push('/auth/login')
    } else {
      router.push(route)
    }
  }

  const features = [
    {
      icon: <FileText className="h-6 w-6 text-primary dark:text-white opacity-70" />,
      title: "Summarization",
      onClick: () => handleFeatureClick("summarization", "/summarization")
    },
    {
      icon: <AlertTriangle className="h-6 w-6 text-destructive dark:text-white opacity-70" />,
      title: "Clause Risk Analysis",
      onClick: () => handleFeatureClick("clause risk analysis", "/risk")
    },
    {
      icon: <MessageCircle className="h-6 w-6 text-primary dark:text-white opacity-70" />,
      title: "AI Chatbot",
      onClick: () => router.push('/chat')
    },
    {
      icon: <Search className="h-6 w-6 text-primary dark:text-white opacity-70" />,
      title: "Document Query",
      onClick: () => handleFeatureClick("document query", "/query")
    }
  ]

  return (
    <section id="features" className="mx-0 py-24 px-4 sm:px-6 bg-gray-50 dark:bg-background section">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full px-4 py-2 text-sm font-medium mb-1">
            You Get
          </span>
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Powerful Features
          </h2>
          <p className="text-lg text-muted-foreground dark:text-white max-w-xl mx-auto">
            From summaries to risk detection, everything you need in one platform.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              onClick={feature.onClick}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
