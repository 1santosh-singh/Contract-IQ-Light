"use client"

import React, { useState, useEffect } from 'react'
import { MainLayout } from "@/components/layout/main-layout"
import { HeroSection } from '@/components/sections/HeroSection'
import { FeaturesSection } from '@/components/sections/FeaturesSection'
import { ResultsSection } from '@/components/sections/ResultsSection'
import { useAuth } from '@/hooks/useAuth'

export default function HomePage() {
  const [openChat, setOpenChat] = useState(false)
  const [isFirstVisit, setIsFirstVisit] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const visited = localStorage.getItem('visited')
    if (visited) {
      setIsFirstVisit(false)
    } else {
      localStorage.setItem('visited', 'true')
    }
  }, [])

  useEffect(() => {
    // For both first and subsequent visits, use IntersectionObserver for efficiency
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in')
          observer.unobserve(entry.target)
        }
      })
    }, {
      threshold: 0.1,
      rootMargin: '-20% 0px -20% 0px'
    })

    const sections = document.querySelectorAll('.section')
    sections.forEach((section, index) => {
      // For first visit, add staggered class via data attribute for CSS delay
      if (isFirstVisit) {
        section.setAttribute('data-delay', index.toString())
      }
      if (section.getBoundingClientRect().top < window.innerHeight) {
        section.classList.add('animate-fade-in')
      } else {
        observer.observe(section)
      }
    })

    return () => observer.disconnect()
  }, [isFirstVisit])

  return (
    <MainLayout className="pt-0 pb-0" openChat={openChat} onCloseChat={() => setOpenChat(false)}>
      <HeroSection />
      <FeaturesSection />
      <ResultsSection />
      
      {/* Why Choose Us Section */}
      <section className="py-24 mx-0 px-4 sm:px-6 bg-gradient-to-b from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 section">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <div className="space-y-8">
              <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full px-4 py-2 text-sm font-medium">
                Trusted Choice
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground dark:text-white">
                Why Choose Contract IQ
              </h2>
              <p className="text-lg text-muted-foreground/80 dark:text-white/80 max-w-md mb-1">
                Because your contracts deserve more than just storage — they deserve intelligence, speed, and security.
              </p>
              <div className="space-y-6">
                <div className="flex items-start space-x-3 p-4 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="h-5 w-5 text-primary dark:text-white mt-1 flex-shrink-0">🛡️</div>
                  <div>
                    <h3 className="font-semibold text-foreground dark:text-white">Confidential & Secure</h3>
                    <p className="text-sm text-muted-foreground dark:text-white">Enterprise-grade encryption keeps your documents private and protected.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="h-5 w-5 text-primary dark:text-white mt-1 flex-shrink-0">⏰</div>
                  <div>
                    <h3 className="font-semibold text-foreground dark:text-white">Time-Saving Insights</h3>
                    <p className="text-sm text-muted-foreground dark:text-white">Summaries, risk detection, and analysis in seconds — not hours.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="h-5 w-5 text-primary dark:text-white mt-1 flex-shrink-0">💼</div>
                  <div>
                    <h3 className="font-semibold text-foreground dark:text-white">Made for Professionals</h3>
                    <p className="text-sm text-muted-foreground dark:text-white">Tailored for legal teams, businesses, and decision-makers.</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Right Column - Image */}
            <div className="aspect-video rounded-lg shadow-lg overflow-hidden relative translate-y-20">
              <img
                src="https://i.ibb.co/7tVYK9jm/Gemini-Generated-Image-wu9m8awu9m8awu9m.png"
                alt="Gemini Generated Image"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 mx-0 px-4 sm:px-6 bg-gradient-to-b from-blue-100 to-blue-200 dark:from-blue-950 dark:to-blue-900 section">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="inline-block bg-white dark:bg-blue-900 text-blue-800 dark:text-white rounded-full px-4 py-2 text-sm font-medium">
            Get Started Today
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground dark:text-white mb-0">
            Turn Complex Contracts Into Clear Insights
          </h2>
          <p className="text-base text-muted-foreground/70 dark:text-white/70 max-w-md mx-auto mt-0">
            Join thousands of professionals using Contract IQ to simplify, analyze, and secure their contracts with AI.
          </p>
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 px-6 py-3 rounded-lg font-medium">
                Try For Free
              </button>
              <a 
                href="/auth/signup"
                className="border border-border dark:border-white text-foreground dark:text-white hover:bg-accent/50 transition-all duration-300 transform hover:-translate-y-0.5 px-6 py-3 rounded-lg font-medium"
              >
                Sign Up →
              </a>
            </div>
          )}
          <p className="text-sm text-muted-foreground/60 dark:text-white/60">
            No credit card required. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="mx-0 px-4 sm:px-6 bg-gradient-to-r from-blue-900 to-blue-800 text-white dark:from-gray-900 dark:to-gray-800 pt-16 pb-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-foreground dark:text-white">Contract IQ</h3>
              <p className="text-gray-400 text-sm">
                Simplify legal contracts with AI-powered analysis and insights. Get instant summaries, risk assessments, and intelligent search across all your documents securely and efficiently.
              </p>
              <div className="flex space-x-4 mt-4">
                <a href="https://twitter.com" className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white hover:text-primary transition-all duration-300">
                  🐦
                </a>
                <a href="https://github.com" className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white hover:text-primary transition-all duration-300">
                  🐙
                </a>
                <a href="https://linkedin.com" className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white hover:text-primary transition-all duration-300">
                  💼
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-foreground dark:text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#home" className="text-gray-400 hover:text-blue-300 transition-all duration-200 hover:underline">Home</a></li>
                <li><a href="#features" className="text-gray-400 hover:text-blue-300 transition-all duration-200 hover:underline">Features</a></li>
                <li><a href="/pricing" className="text-gray-400 hover:text-blue-300 transition-all duration-200 hover:underline">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground dark:text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="/about" className="text-gray-400 hover:text-blue-300 transition-all duration-200 hover:underline">About</a></li>
                <li><a href="/blog" className="text-gray-400 hover:text-blue-300 transition-all duration-200 hover:underline">Blog</a></li>
                <li><a href="/contact" className="text-gray-400 hover:text-blue-300 transition-all duration-200 hover:underline">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground dark:text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="/privacy" className="text-gray-400 hover:text-blue-300 transition-all duration-200 hover:underline">Privacy</a></li>
                <li><a href="/terms" className="text-gray-400 hover:text-blue-300 transition-all duration-200 hover:underline">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <p className="text-gray-400 text-sm">
              © 2025 Contract IQ. All rights reserved.
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Made with ❤️ by Santosh Singh
            </p>
          </div>
        </div>
      </footer>
    </MainLayout>
  )
}
