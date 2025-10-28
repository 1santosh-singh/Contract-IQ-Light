"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useState, useEffect, useMemo, useRef } from "react"
import { FileText, Clock, Loader2, Upload, Check, X, Search, MessageCircle, Send, Bot, Maximize2, Database, Zap } from "lucide-react"
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'

export default function DocumentQueryPage() {
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [querying, setQuerying] = useState(false)
  const [recentDocumentId, setRecentDocumentId] = useState<string | null>(null)
  const [hasRecentUpload, setHasRecentUpload] = useState(false)
  const [openQueryPanel, setOpenQueryPanel] = useState(false)
  const [chatState, setChatState] = useState<'normal' | 'maximized'>('normal')
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [inputValue, setInputValue] = useState('')
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [useRag, setUseRag] = useState(true) // Toggle for RAG vs Chat API
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [textareaHeight, setTextareaHeight] = useState(40)

  useEffect(() => {
    setLoading(false)
  }, [])

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
    }

    getInitialSession()

    // Store the previous session for cleanup purposes
    let previousSession: any = null
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Store previous session before updating
      const wasLoggedIn = previousSession?.access_token
      
      setUser(session?.user ?? null)
      
      // Handle logout cleanup - use previous session token before it expires
      if (event === 'SIGNED_OUT' && wasLoggedIn && previousSession?.access_token) {
        console.log('[DEBUG] User signed out, cleaning up documents with previous session token')
        const clearDocuments = async () => {
          try {
            const response = await fetch('/api/clear-documents', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${previousSession.access_token}`
              }
            })
            
            if (response.ok) {
              console.log('[DEBUG] Documents cleared successfully on logout')
            } else {
              console.error('[ERROR] Failed to clear documents on logout:', await response.text())
            }
          } catch (error) {
            console.error('[ERROR] Failed to clear documents on logout:', error)
          }
        }
        clearDocuments()
        sessionStorage.removeItem('querySessionCleared')
      }
      
      // Update previous session for next iteration
      previousSession = session
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    const storedId = localStorage.getItem('recentDocumentId')
    if (storedId) {
      setRecentDocumentId(storedId)
      setHasRecentUpload(true)
    }
  }, [])

  useEffect(() => {
    if (!user) return

    const sessionKey = 'querySessionCleared'
    const cleared = sessionStorage.getItem(sessionKey)

    if (!cleared) {
      sessionStorage.setItem(sessionKey, 'true')
    }
  }, [user, supabase])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      const newHeight = Math.max(40, Math.min(scrollHeight, 120))
      setTextareaHeight(newHeight)
    }
  }, [inputValue])

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      const { data: docData } = await supabase
        .from('user_documents')
        .select('storage_path')
        .eq('id', docId)
        .single()

      if (docData?.storage_path) {
        const { error: storageError } = await supabase.storage
          .from('contract_iq')
          .remove([docData.storage_path])

        if (storageError) {
          console.error('Storage delete error:', storageError)
        }
      }

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
      if (recentDocumentId === docId) {
        localStorage.removeItem('recentDocumentId')
        setRecentDocumentId(null)
        setHasRecentUpload(false)
        setOpenQueryPanel(false)
        setMessages([])
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete document')
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await handleUpload(file)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      await handleUpload(file)
    }
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        toast.error('Please log in to upload documents')
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
      localStorage.setItem('recentDocumentId', result.document_id)
      setRecentDocumentId(result.document_id)
      setHasRecentUpload(true)
      toast.success('Document uploaded! Ready to query.')
      setOpenQueryPanel(true)
      setChatState('normal')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef) fileInputRef.value = ''
    }
  }

  const handleQuery = async () => {
    const text = inputValue.trim()
    if (!text || !recentDocumentId) return

    setMessages(prev => [...prev, { role: 'user' as const, content: text }])
    setInputValue('')
    setQuerying(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        toast.error('Please log in to query')
        return
      }

      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ document_id: recentDocumentId, query: text, use_rag: useRag }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Query error:', errorText)
        throw new Error('Query failed')
      }

      const result = await response.json()
      setMessages(prev => [...prev, { role: 'assistant' as const, content: result.answer }])
    } catch (error) {
      console.error('Query error:', error)
      setMessages(prev => [...prev, { role: 'assistant' as const, content: 'Sorry, there was an error processing your query.' }])
    } finally {
      setQuerying(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }
  const handleBrowseClick = () => fileInputRef?.click()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-200 to-white dark:from-green-900 dark:to-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary dark:text-white" />
      </div>
    )
  }

  const queryPanelClassName = `fixed z-50 transition-all duration-300 ease-out transform origin-bottom-right ${
    chatState === 'maximized'
      ? 'top-0 left-0 w-full h-full sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[70vw] sm:h-[80vh] bg-white dark:bg-gray-900 border border-border rounded-lg shadow-2xl'
      : 'bottom-0 right-0 w-full h-[55vh] sm:bottom-4 sm:right-4 sm:w-96 sm:max-h-[85vh]'
  } scale-100 opacity-100 ${chatState === 'maximized' ? '' : 'bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl border-white/20 dark:border-gray-700/30 rounded-2xl shadow-2xl'} overflow-hidden`

  return (
    <>
      <div className={`min-h-screen bg-gradient-to-b from-green-200 to-white dark:from-green-900 dark:to-gray-900 animate-fade-in ${chatState === 'maximized' ? 'blur-sm' : ''}`}>
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-4 mb-8 animate-slide-up">
              <span className="inline-block bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full px-4 py-2 text-sm font-medium">
                Document Query
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground dark:text-white">
                Query Your Documents
              </h2>
              <p className="text-sm text-muted-foreground dark:text-white max-w-xl mx-auto">
                Upload or select a document to ask questions and get answers based only on its content using AI.
              </p>
            </div>

            {hasRecentUpload && recentDocumentId ? (
              <div className="text-center py-12">
                <div
                  className="relative border-2 border-dashed border-green-500 bg-green-50 dark:bg-green-950/50 rounded-lg p-8 min-h-[300px] flex flex-col justify-center items-center shadow-2xl transition-all duration-400 ease-in-out mb-6 cursor-default"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(recentDocumentId!)}
                    className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full glass bg-destructive/20 hover:bg-destructive/30 border-destructive/50 text-destructive-foreground dark:text-white shadow-md backdrop-blur-sm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="transition-all duration-1000 ease-in-out opacity-100 scale-100">
                    <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center animate-pulse transition-all duration-1000 ease-in-out opacity-100 scale-100 mb-4">
                      <Check className="h-8 w-8 text-white transition-all duration-1000 ease-out opacity-100 scale-100" />
                    </div>
                  </div>
                </div>
                <Button
                  size="lg"
                  onClick={() => {
                    setOpenQueryPanel(true)
                    setChatState('normal')
                  }}
                  className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Query Document
                </Button>
              </div>
            ) : (
              <div className="text-center py-12">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-400 ease-in-out shadow-xl hover:shadow-2xl bg-gray-100 dark:bg-gray-900 min-h-[300px] flex flex-col justify-center ${
                    !user
                      ? "cursor-not-allowed opacity-50 border-gray-300 dark:border-gray-600"
                      : isDragging
                      ? "border-green-500 bg-green-50 dark:bg-green-950/50 shadow-2xl cursor-pointer"
                      : uploading
                      ? "border-green-500 bg-green-50 dark:bg-green-950/50 shadow-2xl cursor-wait"
                      : "border-gray-400 dark:border-white/50 hover:border-gray-500 dark:hover:border-white cursor-pointer"
                  }`}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={!user || uploading ? undefined : handleBrowseClick}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center space-y-4">
                      <Loader2 className="h-12 w-12 text-primary dark:text-white animate-spin" />
                      <p className="text-xl font-semibold text-foreground dark:text-white">Uploading Document...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xl font-semibold text-foreground dark:text-white">Drop Your Document Here</p>
                      <div className="flex justify-center">
                        <Search className="h-12 w-12 text-primary dark:text-white" />
                      </div>
                      <p className="text-sm text-foreground dark:text-white">or browse to select from your device</p>
                      <Button variant="ghost" className="text-foreground dark:text-white" disabled={!user}>
                        Select File
                      </Button>
                       <p className="text-xs text-muted-foreground dark:text-white">Supports PDF, DOCX</p>
                     </div>
                   )}
                 </div>
                 <input
                   ref={(el) => setFileInputRef(el)}
                   type="file"
                   accept=".pdf,.docx"
                   onChange={handleFileSelect}
                   className="hidden"
                 />
               </div>
             )}
           </div>
         </section>
       </div>

       {/* Query Panel - Floating like Chatbot */}
       {openQueryPanel && recentDocumentId && (
         <div className={queryPanelClassName}>
           <div className="flex flex-col h-full">
             {/* Header */}
             <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-100 to-teal-100 dark:from-green-900 dark:to-teal-900 border-b border-border">
               <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center">
                   <Bot className="h-6 w-6 text-white" />
                 </div>
                 <div>
                   <h3 className="font-semibold text-gray-800 dark:text-white">Document Query Assistant</h3>
                 </div>
               </div>
               <div className="flex gap-2">
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={() => setChatState(chatState === 'maximized' ? 'normal' : 'maximized')}
                   className="h-6 w-6 p-0 rounded-md hover:bg-gray-400/50 dark:hover:bg-white/10"
                 >
                   <Maximize2 className="h-3 w-3 text-gray-800 dark:text-white" />
                 </Button>
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={() => {
                     setOpenQueryPanel(false)
                     setChatState('normal')
                   }}
                   className="h-6 w-6 p-0 rounded-md hover:bg-gray-400/50 dark:hover:bg-white/10"
                 >
                   <X className="h-3 w-3 text-gray-800 dark:text-white" />
                 </Button>
               </div>
             </div>

             {/* Messages */}
             <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-messages">
               {messages.length === 0 && !querying && (
                 <div className="text-center py-8">
                   <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground dark:text-gray-400" />
                   <p className="text-lg text-foreground dark:text-white">Ask questions about your document</p>
                 </div>
               )}
               {messages.map((msg, index) => (
                 <div key={index} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                   <div className={`flex flex-col ${msg.role === 'assistant' ? 'items-start' : 'items-end'} max-w-[70%]`}>
                     <div className={`px-4 py-2 rounded-2xl shadow-sm text-sm leading-relaxed prose prose-sm max-w-none ${msg.role === 'assistant' ? 'bg-green-50 dark:bg-green-950 text-gray-800 dark:text-white rounded-br-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'}`}>
                       <ReactMarkdown components={{
                         p: ({ children }) => <p className="mb-2 last:mb-0 break-words">{children}</p>,
                         ul: ({ children }) => <ul className="mb-2 last:mb-0 list-disc list-inside ml-4">{children}</ul>,
                         ol: ({ children }) => <ol className="mb-2 last:mb-0 list-decimal list-inside ml-4">{children}</ol>,
                         li: ({ children }) => <li className="mb-1">{children}</li>,
                         strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                         code: ({ children }) => <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-mono text-xs">{children}</code>,
                       }}>
                         {msg.content}
                       </ReactMarkdown>
                     </div>
                   </div>
                 </div>
               ))}
               {querying && (
                 <div className="flex justify-start">
                   <div className="flex flex-col items-start max-w-[70%]">
                     <div className="px-4 py-2 bg-green-50 dark:bg-green-950 text-gray-800 dark:text-white rounded-2xl rounded-br-md shadow-sm">
                       <div className="flex items-center gap-1 h-4">
                         <div className="typing-dots">
                           <span className="typing-dot"></span>
                           <span className="typing-dot"></span>
                           <span className="typing-dot"></span>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
               )}
             </div>

             {/* Toggle Switch */}
            <div className={`px-4 py-3 border-t ${chatState === 'maximized' ? 'border-border bg-white dark:bg-gray-900' : 'border-white/20 dark:border-gray-700/30 bg-white/5 dark:bg-gray-800/50 backdrop-blur-md'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Query Mode:</span>
                  <div className="flex items-center gap-1">
                    <Database className={`h-4 w-4 ${useRag ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className={`text-xs ${useRag ? 'text-green-600 font-medium' : 'text-gray-500'}`}>RAG</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className={`h-4 w-4 ${!useRag ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className={`text-xs ${!useRag ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>Chat API</span>
                  </div>
                </div>
                <button
                  onClick={() => setUseRag(!useRag)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                    useRag ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      useRag ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {useRag 
                  ? "Using document-specific RAG pipeline for accurate answers" 
                  : "Using general Chat API for broader knowledge"
                }
              </div>
            </div>

            {/* Input */}
            <div className={`px-4 py-2 border-t ${chatState === 'maximized' ? 'border-border bg-white dark:bg-gray-900' : 'border-white/20 dark:border-gray-700/30 bg-white/5 dark:bg-gray-800/50 backdrop-blur-md'}`}>
              <div className="flex items-stretch gap-2">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask a question about the document..."
                  className={`flex-1 transition-all duration-200 ease-in-out ${chatState === 'maximized' ? 'bg-muted/20 dark:bg-gray-800/30 border-border' : 'bg-white/20 dark:bg-gray-800/70 backdrop-blur-md border border-gray-300 dark:border-gray-600'} text-gray-900 dark:text-white placeholder:text-gray-600 dark:placeholder:text-gray-400 resize-none`}
                  style={{ height: textareaHeight }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleQuery()
                    }
                  }}
                />
                <Button
                  onClick={handleQuery}
                  disabled={!inputValue.trim() || !recentDocumentId || querying}
                  className="flex-shrink-0 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg h-16 w-16 overflow-hidden flex items-center justify-center"
                >
                  {querying ? <Loader2 className="h-14 w-14 animate-spin" /> : <Send className="h-14 w-14" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
       )}

      <style jsx>{`
        .typing-dots {
          display: flex;
          gap: 4px;
          align-items: center;
        }
        .typing-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: currentColor;
          animation: typing 1.4s infinite;
        }
        .typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
      `}</style>
    </>
  )
}