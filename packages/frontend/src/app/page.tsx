"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { createClient } from '@/lib/supabase'
import { useState, useRef, useEffect, useMemo } from "react"
import { Loader2 } from "lucide-react"
import { FileText, AlertTriangle, MessageCircle, Lock, Search, Check, Zap, Globe, Shield, Clock, Briefcase, Twitter, Github, Linkedin, Upload } from "lucide-react"
import { toast } from 'sonner'
import { X } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const [openChat, setOpenChat] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploaded, setIsUploaded] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showFeatureZoom, setShowFeatureZoom] = useState(false)
  const [isFirstVisit, setIsFirstVisit] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [resetKey, setResetKey] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const supabase = useMemo(() => createClient(), [])
  useEffect(() => {
    const visited = localStorage.getItem('visited')
    if (visited) {
      setIsFirstVisit(false)
    } else {
      localStorage.setItem('visited', 'true')
    }

    // Check for recent upload to show success tick
    const recentId = localStorage.getItem('recentDocumentId')
    if (recentId) {
      setIsUploaded(true)
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

  useEffect(() => {

    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
      // Clear documents only on initial session load if needed, but to persist across navigation, skip here
      // Documents will be cleared on logout via onAuthStateChange
    }

    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
      if (!session) {
        localStorage.removeItem('documentsCleared')
        localStorage.removeItem('recentDocumentId')
        setIsUploaded(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleDelete = async () => {
    const docId = localStorage.getItem('recentDocumentId')
    if (!docId || !confirm('Are you sure you want to delete this document?')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please log in to delete documents')
        return
      }

      // Query storage_path
      const { data: docData } = await supabase
        .from('user_documents')
        .select('storage_path')
        .eq('id', docId)
        .single()

      // Remove storage file if exists
      if (docData?.storage_path) {
        const { error: storageError } = await supabase.storage
          .from('contract_iq')
          .remove([docData.storage_path])

        if (storageError) {
          console.error('Storage delete error:', storageError)
        }
      }

      // Delete DB records
      await supabase
        .from('user_documents')
        .delete()
        .eq('id', docId)

      await supabase
        .from('document_chunks')
        .delete()
        .eq('document_id', docId)

      await supabase
        .from('document_summaries')
        .delete()
        .eq('document_id', docId)

      toast.success('Document deleted successfully')
      localStorage.removeItem('recentDocumentId')
      setIsUploaded(false)
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete document')
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('file', file)

      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) {
          toast.error('Please log in to upload documents')
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
          setResetKey(prev => prev + 1)
          return
        }

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Upload failed')
        }

        const result = await response.json()
        toast.success('File uploaded successfully!')
        localStorage.setItem('recentDocumentId', result.document_id)
        setIsUploaded(true)
      } catch (error) {
        console.error('Upload error:', error)
        toast.error('Upload failed. Please try again.')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } finally {
        setIsUploading(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        setResetKey(prev => prev + 1)
      }
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('file', file)

      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) {
          toast.error('Please log in to upload documents')
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
          setResetKey(prev => prev + 1)
          return
        }

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Upload failed')
        }

        const result = await response.json()
        toast.success('File uploaded successfully!')
        localStorage.setItem('recentDocumentId', result.document_id)
        setIsUploaded(true)
      } catch (error) {
        console.error('Upload error:', error)
        toast.error('Upload failed. Please try again.')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        setResetKey(prev => prev + 1)
      } finally {
        setIsUploading(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        setResetKey(prev => prev + 1)
      }
    }
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  function Counter({ target, duration = 2000 }: { target: number; duration?: number }) {
    const [count, setCount] = useState(0)
    const startTimeRef = useRef<number>()
  
    useEffect(() => {
      const startTime = Date.now()
      startTimeRef.current = startTime
      let animationFrame: number
  
      const animate = () => {
        if (!startTimeRef.current) return
  
        const elapsed = Date.now() - startTimeRef.current
        const progress = Math.min(elapsed / duration, 1)
        const currentCount = Math.floor(target * progress)
  
        setCount(currentCount)
  
        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate)
        }
      }
  
      animationFrame = requestAnimationFrame(animate)
  
      return () => {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame)
        }
      }
    }, [target, duration])
  
    return <span>{count.toLocaleString()}</span>
  }

  return (
    <MainLayout className="pt-0 pb-0" openChat={openChat} onCloseChat={() => setOpenChat(false)}>
      <section id="home" className="-mt-16 pt-40 pb-24 mx-0 px-4 sm:px-6 bg-gradient-to-b from-blue-200 to-white dark:from-blue-900 dark:to-gray-900 section">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Side */}
            <div className="space-y-8">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                <span className="text-black dark:text-white">Simplify</span><br />
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">Legal Contracts</span><br />
                <span className="text-black dark:text-white">with AI</span>
              </h1>
              <p className="text-xl leading-relaxed text-muted-foreground dark:text-white max-w-md">
                Upload, analyze, and understand contracts in seconds.
              </p>
              {!user && (
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5" onClick={() => toast("Upload your document")}>
                    Try for Free
                  </Button>
                  <Button size="lg" variant="outline" asChild className="border-border dark:border-white text-foreground dark:text-white hover:bg-accent/50 transition-all duration-300 transform hover:-translate-y-0.5">
                    <Link href="/auth/signup">Sign Up →</Link>
                  </Button>
                </div>
              )}
            </div>
            {/* Right Side */}
            <div className="space-y-4">
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-400 ease-in-out shadow-xl hover:shadow-2xl bg-gray-100 dark:bg-gray-900 min-h-[300px] flex flex-col justify-center ${
                  isUploaded
                    ? "border-green-500 bg-green-50 dark:bg-green-950/50 shadow-2xl cursor-default"
                    : isUploading
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50 shadow-2xl cursor-wait"
                    : isDragging
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50 shadow-2xl cursor-pointer"
                    : "border-gray-400 dark:border-white/50 hover:border-gray-500 dark:hover:border-white cursor-pointer"
                }`}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={!isUploaded && !isUploading ? handleBrowseClick : undefined}
              >
                {isUploaded && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full glass bg-destructive/20 hover:bg-destructive/30 border-destructive/50 text-destructive-foreground dark:text-white shadow-md backdrop-blur-sm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <div className="space-y-4">
                  <div className={`transition-all duration-1000 ease-in-out ${isUploaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                    {isUploaded ? (
                      <div className="flex justify-center">
                        <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center animate-pulse transition-all duration-1000 ease-in-out opacity-100 scale-100">
                          <Check className="h-8 w-8 text-white transition-all duration-1000 ease-out opacity-100 scale-100" />
                        </div>
                      </div>
                    ) : null}
                  </div>
                  {isUploaded ? null : (
                    <>
                      {isUploading ? (
                        <div className="flex flex-col items-center space-y-4">
                          <Loader2 className="h-12 w-12 text-primary dark:text-white animate-spin" />
                          <p className="text-xl font-semibold text-foreground dark:text-white">Uploading Document...</p>
                        </div>
                      ) : (
                        <>
                          <p className="text-xl font-semibold text-foreground dark:text-white">Drop Your Contract</p>
                          <div className="flex justify-center">
                            <Upload className="h-12 w-12 text-primary dark:text-white" />
                          </div>
                          <p className="text-sm text-foreground dark:text-white">or browse to select from your device</p>
                          <Button variant="ghost" className="text-foreground dark:text-white">
                            Select File
                          </Button>
                          <p className="text-xs text-muted-foreground dark:text-white">Supports PDF, DOCX, TXT</p>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
              <input
                key={resetKey}
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </section>
       {/* Powerful Features Section */}
       <section id="features" className="mx-0 py-24 px-4 sm:px-6 bg-background section">
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
             <div className={`bg-gray-50 dark:bg-gray-800/50 text-card-foreground rounded-lg p-8 shadow-sm hover:shadow-lg dark:hover:shadow-black hover:-translate-y-1 transition-all duration-300 border border-border dark:border-white hover:border-accent cursor-pointer`} onClick={() => {
               if (!user) {
                 toast.error('Please log in to use summarization')
                 router.push('/auth/login')
               } else {
                 router.push('/summarization')
               }
             }}>
               <div className="flex justify-center mb-4">
                 <FileText className="h-6 w-6 text-primary dark:text-white opacity-70" />
               </div>
               <h3 className="text-lg font-bold mb-2 text-center text-card-foreground dark:text-white">Summarization</h3>
             </div>
             <div className={`bg-gray-50 dark:bg-gray-800/50 text-card-foreground rounded-lg p-8 shadow-sm hover:shadow-lg dark:hover:shadow-black hover:-translate-y-1 transition-all duration-300 border border-border dark:border-white hover:border-accent cursor-pointer`} onClick={() => {
               if (!user) {
                 toast.error('Please log in to use clause risk analysis')
                 router.push('/auth/login')
               } else {
                 router.push('/risk')
               }
             }}>
               <div className="flex justify-center mb-4">
                 <AlertTriangle className="h-6 w-6 text-destructive dark:text-white opacity-70" />
               </div>
               <h3 className="text-lg font-bold mb-2 text-center text-card-foreground dark:text-white">Clause Risk Analysis</h3>
             </div>
             <div className={`bg-gray-50 dark:bg-gray-800/50 text-card-foreground rounded-lg p-8 shadow-sm hover:shadow-lg dark:hover:shadow-black hover:-translate-y-1 transition-all duration-300 border border-border dark:border-white hover:border-accent cursor-pointer`} onClick={() => setOpenChat(true)}>
               <div className="flex justify-center mb-4">
                 <MessageCircle className="h-6 w-6 text-primary dark:text-white opacity-70" />
               </div>
               <h3 className="text-lg font-bold mb-2 text-center text-card-foreground dark:text-white">AI Chatbot</h3>
             </div>
             <div className="bg-gray-50 dark:bg-gray-800/50 text-card-foreground rounded-lg p-8 shadow-sm hover:shadow-lg dark:hover:shadow-black hover:-translate-y-1 transition-all duration-300 border border-border dark:border-white hover:border-accent cursor-pointer" onClick={() => {
               if (!user) {
                 toast.error('Please log in to use document query')
                 router.push('/auth/login')
               } else {
                 router.push('/query')
               }
             }}>
               <div className="flex justify-center mb-4">
                 <Search className="h-6 w-6 text-primary dark:text-white opacity-70" />
               </div>
               <h3 className="text-lg font-bold mb-2 text-center text-card-foreground dark:text-white">Document Query</h3>
             </div>
           </div>
         </div>
       </section>
{/* Results Section */}
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
      <div className="bg-white/80 dark:bg-gray-900/80 rounded-lg p-6 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 border border-border dark:border-white">
        <div className="flex justify-center mb-4">
          <Check className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="text-3xl font-bold text-primary dark:text-white mb-2">
          <Counter target={99} />%+
        </div>
        <p className="text-sm text-muted-foreground dark:text-white font-medium mb-1">Accuracy</p>
        <p className="text-xs text-muted-foreground dark:text-white">Reliable clause risk detection and summarization</p>
      </div>
      <div className="bg-white/80 dark:bg-gray-900/80 rounded-lg p-6 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 border border-border dark:border-white">
        <div className="flex justify-center mb-4">
          <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="text-3xl font-bold text-primary dark:text-white mb-2">
          <Counter target={80} />K+
        </div>
        <p className="text-sm text-muted-foreground dark:text-white font-medium mb-1">Contracts Processed</p>
        <p className="text-xs text-muted-foreground dark:text-white">From startups to enterprises worldwide</p>
      </div>
      <div className="bg-white/80 dark:bg-gray-900/80 rounded-lg p-6 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 border border-border dark:border-white">
        <div className="flex justify-center mb-4">
          <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="text-3xl font-bold text-primary dark:text-white mb-2">
          <span>{'< '}</span><Counter target={5} /> Seconds
        </div>
        <p className="text-sm text-muted-foreground dark:text-white font-medium mb-1">Analysis</p>
        <p className="text-xs text-muted-foreground dark:text-white">Rapid insights, no waiting around</p>
      </div>
      <div className="bg-white/80 dark:bg-gray-900/80 rounded-lg p-6 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 border border-border dark:border-white">
        <div className="flex justify-center mb-4">
          <Globe className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="text-3xl font-bold text-primary dark:text-white mb-2">
          <Counter target={20} />+
        </div>
        <p className="text-sm text-muted-foreground dark:text-white font-medium mb-1">Industries</p>
        <p className="text-xs text-muted-foreground dark:text-white">Versatile solutions across legal, finance, and corporate sectors</p>
      </div>
    </div>
  </div>
</section>

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
                    <Shield className="h-5 w-5 text-primary dark:text-white mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-foreground dark:text-white">Confidential & Secure</h3>
                      <p className="text-sm text-muted-foreground dark:text-white">Enterprise-grade encryption keeps your documents private and protected.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-4 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <Clock className="h-5 w-5 text-primary dark:text-white mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-foreground dark:text-white">Time-Saving Insights</h3>
                      <p className="text-sm text-muted-foreground dark:text-white">Summaries, risk detection, and analysis in seconds — not hours.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-4 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <Briefcase className="h-5 w-5 text-primary dark:text-white mt-1 flex-shrink-0" />
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
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5" onClick={() => toast("Upload your document")}>
                  Try For Free
                </Button>
                <Button size="lg" variant="outline" asChild className="border-border dark:border-white text-foreground dark:text-white hover:bg-accent/50 transition-all duration-300 transform hover:-translate-y-0.5">
                  <Link href="/auth/signup">Sign Up →</Link>
                </Button>
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
                    <Twitter className="h-5 w-5" />
                  </a>
                  <a href="https://github.com" className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white hover:text-primary transition-all duration-300">
                    <Github className="h-5 w-5" />
                  </a>
                  <a href="https://linkedin.com" className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white hover:text-primary transition-all duration-300">
                    <Linkedin className="h-5 w-5" />
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
