import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Dashboard from "@/components/dashboard"
import Setup from "@/components/setup"

export default function Home() {
  return (
    <main className="container mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6">House Cleaning Manager</h1>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="setup">Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <Dashboard />
        </TabsContent>

        <TabsContent value="setup">
          <Setup />
        </TabsContent>
      </Tabs>
    </main>
  )
}
