import { MainLayout } from "@/components/layout/main-layout"
import { 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  Search,
  Plus,
  Settings,
  User
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function ComponentsPage() {
  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Component Showcase
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Explore our beautiful glassmorphic UI components built with TailwindCSS and Framer Motion
          </p>
        </div>

        {/* Glassmorphic Cards */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-center">Glassmorphic Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Feature Card", description: "Beautiful glassmorphic design with backdrop blur" },
              { title: "Info Card", description: "Semi-transparent background with subtle borders" },
              { title: "Action Card", description: "Interactive elements with hover effects" }
            ].map((card, index) => (
              <div
                key={card.title}
                className="transition-all duration-300 hover:transform hover:-translate-y-1"
              >
                <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      {card.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{card.description}</p>
                    <Button className="mt-4 w-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300">
                      Learn More
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </section>

        {/* Buttons */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-center">Glassmorphic Buttons</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300">
              Primary Button
            </Button>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Outline Button
            </Button>
            <Button variant="ghost" className="hover:bg-white/10">
              Ghost Button
            </Button>
            <Button size="sm" className="bg-white/10 backdrop-blur-md border border-white/20">
              Small Button
            </Button>
            <Button size="lg" className="bg-white/10 backdrop-blur-md border border-white/20">
              Large Button
            </Button>
          </div>
        </section>

        {/* Form Elements */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-center">Form Elements</h2>
          <div className="max-w-md mx-auto space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Input</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search components..."
                  className="bg-white/10 backdrop-blur-md border border-white/20 pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Text Input</label>
              <Input
                placeholder="Enter text..."
                className="bg-white/10 backdrop-blur-md border border-white/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Textarea</label>
              <textarea
                placeholder="Enter description..."
                className="w-full p-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 resize-none"
                rows={3}
              />
            </div>
          </div>
        </section>

        {/* Interactive Elements */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-center">Interactive Elements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Avatar */}
            <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle>Avatar Component</CardTitle>
                <CardDescription>User profile pictures with fallbacks</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src="/avatars/01.png" alt="@user" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-lg">
                    JD
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">John Doe</p>
                  <p className="text-xs text-muted-foreground">john@example.com</p>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
                <CardDescription>Key metrics and data points</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Users</span>
                  <span className="text-2xl font-bold">1,234</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Projects</span>
                  <span className="text-2xl font-bold">56</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="text-2xl font-bold text-green-500">98.5%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Animations */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-center">Animations & Effects</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div
              className="p-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-center transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <h3 className="font-semibold mb-2">Hover Effect</h3>
              <p className="text-sm text-muted-foreground">Hover over me!</p>
            </div>
            
            <div
              className="p-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-center animate-pulse"
            >
              <h3 className="font-semibold mb-2">Pulse Effect</h3>
              <p className="text-sm text-muted-foreground">I pulse continuously</p>
            </div>
            
            <div
              className="p-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-center transition-all duration-300 hover:rotate-1"
            >
              <h3 className="font-semibold mb-2">Hover Rotate</h3>
              <p className="text-sm text-muted-foreground">Hover to see rotation</p>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  )
}
