/**
 * Hero section component
 */
import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileUploadZone } from '@/components/ui/FileUploadZone'
import { useFileUpload } from '@/hooks/useFileUpload'
import { useAuth } from '@/hooks/useAuth'

export const HeroSection: React.FC = () => {
  const { user } = useAuth()
  const {
    isUploading,
    isUploaded,
    fileInputRef,
    handleFileSelect,
    handleDrop,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDelete
  } = useFileUpload()

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  return (
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
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5" 
                  onClick={() => handleBrowseClick()}
                >
                  Try for Free
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  asChild 
                  className="border-border dark:border-white text-foreground dark:text-white hover:bg-accent/50 transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <Link href="/auth/signup">Sign Up →</Link>
                </Button>
              </div>
            )}
          </div>
          
          {/* Right Side */}
          <div className="space-y-4">
            <FileUploadZone
              isUploaded={isUploaded}
              isUploading={isUploading}
              onFileSelect={handleBrowseClick}
              onDelete={handleDelete}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            />
            <input
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
  )
}
