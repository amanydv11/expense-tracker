import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-gray-800">
            Finance Tracker
          </Link>
          <div className="space-x-4">
            <Link href="/transactions" className="text-gray-600 hover:text-gray-900">
              Transactions
            </Link>
            <Link href="/budgets" className="text-gray-600 hover:text-gray-900">
              Budgets
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
} 