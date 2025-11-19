"use client"

import { useState, useEffect } from "react"
import {
  Settings,
  User,
  Sun,
  Moon,
  LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu"
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

interface NavbarProps {
  className?: string
  onToggleTheme?: () => void
  isDark?: boolean
}

export function Navbar({ className, onToggleTheme, isDark = false }: NavbarProps) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])



  return (
    <header
      className={cn(
        "bg-white/[0.01] dark:bg-black/[0.01] backdrop-blur-md sticky top-0 z-50 w-full fixed left-0 right-0 border-b border-white/10 dark:border-white/5",
        className
      )}
      style={{
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)'
      }}
    >
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        {/* Left Section - Logo */}
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-foreground">Contract IQ</h1>
        </div>

        {/* Center Section - Navigation Links */}
        <div className="hidden md:flex items-center gap-8 flex-1 justify-center">
          <NavigationMenu>
            <NavigationMenuList className="gap-8">
              <NavigationMenuItem>
                <NavigationMenuLink className="text-foreground hover:text-blue-600 transition-colors bg-transparent hover:bg-transparent font-semibold" href="#home">Home</NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink className="text-foreground hover:text-blue-600 transition-colors bg-transparent hover:bg-transparent font-semibold" href="#features">Features</NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink className="text-foreground hover:text-blue-600 transition-colors bg-transparent hover:bg-transparent font-semibold" href="#pricing">Pricing</NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink className="text-foreground hover:text-blue-600 transition-colors bg-transparent hover:bg-transparent font-semibold" href="#about">About</NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right Section - User Actions */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleTheme}
            className="text-foreground hover:text-blue-600 transition-colors duration-200 bg-white/10 dark:bg-black/10 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl rounded-xl"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Auth State */}
          {loading ? (
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-r-foreground" />
          ) : user ? (
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                      {user.email?.[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white/10 dark:bg-black/10 backdrop-blur-md border border-white/20 dark:border-black/20 shadow-lg text-foreground dark:text-white data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[side=bottom]:slide-in-from-top-2 data-[state=open]:dropdown-pop transition-all duration-400 ease-out z-50" align="end" forceMount side="bottom">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-foreground dark:text-white">{user.user_metadata?.full_name || user.email}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground dark:text-gray-300">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-blue-300/60 dark:bg-blue-900/50 my-1" />
                <DropdownMenuItem asChild className="hover:bg-blue-300/70 dark:hover:bg-blue-900/30 transition-all duration-150 ease-in-out hover:scale-[1.02] cursor-pointer text-foreground dark:text-white outline-none focus:outline-none focus-visible:outline-none">
                  <Link href="/profile" className="flex items-center w-full">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="hover:bg-blue-300/70 dark:hover:bg-blue-900/30 transition-all duration-150 ease-in-out hover:scale-[1.02] cursor-pointer text-foreground dark:text-white outline-none focus:outline-none focus-visible:outline-none">
                  <Link href="/settings" className="flex items-center w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-blue-300/60 dark:bg-blue-900/50 my-1" />
                <DropdownMenuItem
                  onClick={async () => {
                    const supabase = createClient()
                    await supabase.auth.signOut()
                    window.location.href = '/'
                  }}
                  className="hover:bg-red-100/50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-all duration-150 ease-in-out hover:scale-[1.02] cursor-pointer focus:bg-red-100/50 dark:focus:bg-red-900/30 outline-none focus:outline-none focus-visible:outline-none"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                asChild
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl"
              >
                <Link href="/auth/signup">Sign up</Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className="bg-white/10 dark:bg-black/10 backdrop-blur-sm text-foreground hover:bg-white/20 dark:hover:bg-black/20 border-0 rounded-xl shadow-lg hover:shadow-xl"
              >
                <Link href="/auth/login">Login</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
