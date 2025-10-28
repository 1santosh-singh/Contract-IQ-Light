"use client"

import { MainLayout } from "@/components/layout/main-layout"

export default function ChatPage() {
  return (
    <MainLayout openChat={true}>
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          AI Chat Assistant
        </h1>
        <p className="text-xl text-muted-foreground max-w-md mb-8">
          Ask any questions and get helpful responses from our intelligent AI assistant.
        </p>
        <div className="text-sm text-muted-foreground">
          The chat panel is open below. Start a conversation!
        </div>
      </div>
    </MainLayout>
  )
}