"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DebugPage() {
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [envVars, setEnvVars] = useState<any>({})

  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Session error:', error)
        }
        setSession(session)
        setUser(session?.user || null)
        
        // Check environment variables
        setEnvVars({
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
          supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set',
        })
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) console.error('Login error:', error)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Page</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>User:</strong> {user ? user.email : 'Not logged in'}</p>
              <p><strong>Session:</strong> {session ? 'Active' : 'No session'}</p>
              <p><strong>Token:</strong> {session?.access_token ? 'Present' : 'Missing'}</p>
            </div>
            <div className="mt-4 space-x-2">
              {!user ? (
                <Button onClick={handleLogin}>Login with Google</Button>
              ) : (
                <Button onClick={handleLogout} variant="outline">Logout</Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Supabase URL:</strong> {envVars.supabaseUrl}</p>
              <p><strong>Supabase Anon Key:</strong> {envVars.supabaseAnonKey}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Test</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={async () => {
                try {
                  const response = await fetch('/api/test-auth')
                  const data = await response.json()
                  alert(JSON.stringify(data, null, 2))
                } catch (error) {
                  alert('Error: ' + error)
                }
              }}
            >
              Test API Authentication
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
