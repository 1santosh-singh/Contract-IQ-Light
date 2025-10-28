/**
 * Reusable file upload zone component
 */
import React from 'react'
import { Upload, Check, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FileUploadZoneProps {
  isUploaded: boolean
  isUploading: boolean
  onFileSelect: () => void
  onDelete: () => void
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  isUploaded,
  isUploading,
  onFileSelect,
  onDelete,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop
}) => {
  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-400 ease-in-out shadow-xl hover:shadow-2xl bg-gray-100 dark:bg-gray-900 min-h-[300px] flex flex-col justify-center ${
        isUploaded
          ? "border-green-500 bg-green-50 dark:bg-green-950/50 shadow-2xl cursor-default"
          : isUploading
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50 shadow-2xl cursor-wait"
          : "border-gray-400 dark:border-white/50 hover:border-gray-500 dark:hover:border-white cursor-pointer"
      }`}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={!isUploaded && !isUploading ? onFileSelect : undefined}
    >
      {isUploaded && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
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
  )
}
