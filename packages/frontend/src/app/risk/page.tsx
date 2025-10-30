"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X } from "lucide-react"
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useState, useEffect, useMemo } from "react"
import Link from 'next/link'
import { FileText, Clock, Loader2, Upload, Check, Trash2, AlertTriangle } from "lucide-react"
import { toast } from 'sonner'

export default function RiskAnalysisPage() {
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState<string | null>(null)
  const [recentDocumentId, setRecentDocumentId] = useState<string | null>(null)
  const [hasRecentUpload, setHasRecentUpload] = useState(false)
  const [riskAnalysisText, setRiskAnalysisText] = useState('')
  const [openAnalysis, setOpenAnalysis] = useState(false)
  const [analysisModalState, setAnalysisModalState] = useState<'normal' | 'maximized'>('normal')
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

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
        sessionStorage.removeItem('riskSessionCleared')
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

    const sessionKey = 'riskSessionCleared'
    const cleared = sessionStorage.getItem(sessionKey)

    if (!cleared) {
      sessionStorage.setItem(sessionKey, 'true')
    }
  }, [user, supabase])

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
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
      if (recentDocumentId === docId) {
        localStorage.removeItem('recentDocumentId')
        setRecentDocumentId(null)
        setHasRecentUpload(false)
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
      toast.success('Document uploaded! Analyzing risks...')
      await handleAnalyzeRisk(result.document_id)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef) fileInputRef.value = ''
    }
  }

  const handleAnalyzeRisk = async (documentId: string) => {
    setAnalyzing(documentId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        toast.error('Please log in to analyze risks')
        return
      }

      const response = await fetch('/api/risk-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ document_id: documentId }),
      })

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error('Risk analysis failed')
      }

      const result = await response.json()
      setRiskAnalysisText(result.analysis)
      setOpenAnalysis(true)
      setAnalysisModalState('maximized')
      toast.success('Risk analysis completed!')
    } catch (error) {
      console.error('Risk analysis error:', error)
      toast.error('Failed to analyze risks')
    } finally {
      setAnalyzing(null)
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
      <div className="min-h-screen bg-gradient-to-b from-red-200 to-white dark:from-red-900 dark:to-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary dark:text-white" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-200 to-white dark:from-red-900 dark:to-gray-900 animate-fade-in">
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-4 mb-8 animate-slide-up">
            <span className="inline-block bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 rounded-full px-4 py-2 text-sm font-medium">
              AI Risk Analysis
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground dark:text-white">
              Identify Contract Risks
            </h2>
            <p className="text-sm text-muted-foreground dark:text-white max-w-xl mx-auto">
              Upload or select a document to analyze potential risks and highlight critical clauses using AI.
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
                  className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-sm border border-white/30 dark:border-white/20 text-gray-700 dark:text-white hover:bg-white/30 dark:hover:bg-black/30 shadow-lg transition-all duration-200"
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
                onClick={() => handleAnalyzeRisk(recentDocumentId)}
                disabled={analyzing === recentDocumentId}
                className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {analyzing === recentDocumentId ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Analyzing Risks...
                  </>
                ) : (
                  'Analyze Risks'
                )}
              </Button>
            </div>
          ) : (
            <div className="text-center py-12">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-400 ease-in-out shadow-xl hover:shadow-2xl bg-gray-100 dark:bg-gray-900 min-h-[300px] flex flex-col justify-center ${
                  !user
                    ? "cursor-not-allowed opacity-50 border-gray-300 dark:border-gray-600"
                    : isDragging
                    ? "border-red-500 bg-red-50 dark:bg-red-950/50 shadow-2xl cursor-pointer"
                    : uploading
                    ? "border-red-500 bg-red-50 dark:bg-red-950/50 shadow-2xl cursor-wait"
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
                    <p className="text-xl font-semibold text-foreground dark:text-white">Drop Your Contract Here</p>
                    <div className="flex justify-center">
                      <AlertTriangle className="h-12 w-12 text-primary dark:text-white" />
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

      {/* Risk Analysis Floating Window */}
      {openAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="relative w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden bg-white dark:bg-gray-900 border border-border dark:border-white/20">
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900 dark:to-orange-900 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">Risk Analysis</h3>
                  <p className="text-sm text-muted-foreground dark:text-gray-300">AI-identified risks and highlighted clauses</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpenAnalysis(false)}
                className="h-8 w-8 p-0 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <X className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] modal-content">
              <div
                className="prose prose-lg dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: riskAnalysisText.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}