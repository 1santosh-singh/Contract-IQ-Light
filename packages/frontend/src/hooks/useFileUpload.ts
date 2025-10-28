/**
 * Custom hook for file upload functionality
 */
import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

interface UseFileUploadReturn {
  isUploading: boolean
  isUploaded: boolean
  fileInputRef: React.RefObject<HTMLInputElement>
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => Promise<void>
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  handleDragEnter: (e: React.DragEvent<HTMLDivElement>) => void
  handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void
  handleDelete: () => Promise<void>
  resetUpload: () => void
}

export const useFileUpload = (): UseFileUploadReturn => {
  const [isUploading, setIsUploading] = useState(false)
  const [isUploaded, setIsUploaded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const uploadFile = async (file: File) => {
    setIsUploading(true)
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
      toast.success('File uploaded successfully!')
      localStorage.setItem('recentDocumentId', result.document_id)
      setIsUploaded(true)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await uploadFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      await uploadFile(file)
    }
  }

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

  const resetUpload = () => {
    setIsUploaded(false)
    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return {
    isUploading,
    isUploaded,
    fileInputRef,
    handleFileSelect,
    handleDrop,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDelete,
    resetUpload
  }
}
