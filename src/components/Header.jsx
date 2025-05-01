import Link from 'next/link'
import { Button } from './ui/button'

export default function Header() {
  return (
    <header className="bg-green-500 text-black">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold font-serif text-gray-800">
            Finance-Tracker
          </Link>
          <div className="space-x-4">
            <Link href="/dashboard" className="text-black">
             <Button className='cursor-pointer'>
                Dashboard
             </Button>
            </Link>
            <Link href="/budgets" className="text-black">
            <Button className='cursor-pointer'>
                Budget
             </Button>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
} 