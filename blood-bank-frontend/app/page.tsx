import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight, Droplet, Users, UserPlus, Activity, UserCheck, TestTube, ClipboardList } from "lucide-react"

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="py-12 md:py-16 lg:py-20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Blood Bank Management System
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                Efficiently manage donors, recipients, inventory, and more with our comprehensive blood bank system.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/donor">
                <Button className="h-10 px-8">Register Donor</Button>
              </Link>
              <Link href="/recipient">
                <Button variant="outline" className="h-10 px-8">
                  Register Recipient
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/donor">
          <Card className="h-full transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-red-500" />
                Donor Management
              </CardTitle>
              <CardDescription>Register and manage blood donors</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Register new donors and view existing ones</p>
              <ArrowRight className="h-5 w-5" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/recipient">
          <Card className="h-full transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-blue-500" />
                Recipient Management
              </CardTitle>
              <CardDescription>Register and manage blood recipients</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Register new recipients and view existing ones</p>
              <ArrowRight className="h-5 w-5" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/blood-inventory">
          <Card className="h-full transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplet className="h-5 w-5 text-red-600" />
                Blood Inventory
              </CardTitle>
              <CardDescription>Manage blood stock and inventory</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">View and update blood inventory levels</p>
              <ArrowRight className="h-5 w-5" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/staff">
          <Card className="h-full transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                Staff Management
              </CardTitle>
              <CardDescription>Manage blood bank staff</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Add and manage staff members</p>
              <ArrowRight className="h-5 w-5" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/donation">
          <Card className="h-full transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplet className="h-5 w-5 text-red-500" />
                Donations
              </CardTitle>
              <CardDescription>Record blood donations</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Record new blood donations</p>
              <ArrowRight className="h-5 w-5" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/transfusion">
          <Card className="h-full transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-500" />
                Transfusions
              </CardTitle>
              <CardDescription>Record blood transfusions</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Record new blood transfusions</p>
              <ArrowRight className="h-5 w-5" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/blood-test">
          <Card className="h-full transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5 text-amber-500" />
                Blood Tests
              </CardTitle>
              <CardDescription>Record blood test results</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Record and view blood test results</p>
              <ArrowRight className="h-5 w-5" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports">
          <Card className="h-full transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-gray-500" />
                Reports
              </CardTitle>
              <CardDescription>Generate and view reports</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Access comprehensive blood bank reports</p>
              <ArrowRight className="h-5 w-5" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
