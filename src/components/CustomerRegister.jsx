import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function CustomerRegister() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone })
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('customerToken', data.token)
        navigate('/')
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch (err) {
      setError('Server unreachable')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-mozzarella-100">
      <div className="w-full max-w-md bg-mozzarella-200/60 backdrop-blur rounded-2xl p-10 border border-basil-200 shadow-lg">
        <h2 className="text-2xl font-display font-black text-wood-800 mb-4">Create your account</h2>
        <p className="text-sm text-wood-600 mb-6">Register to order faster and receive offers.</p>
        {error && <div className="p-3 bg-tomato-100 text-tomato-700 mb-4 rounded">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" className="w-full px-4 py-3 rounded bg-mozzarella-100 border border-basil-200 text-wood-800 placeholder-wood-400 outline-none focus:border-tomato-400 focus:ring-2 focus:ring-tomato-200" />
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full px-4 py-3 rounded bg-mozzarella-100 border border-basil-200 text-wood-800 placeholder-wood-400 outline-none focus:border-tomato-400 focus:ring-2 focus:ring-tomato-200" required />
          <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone (optional)" className="w-full px-4 py-3 rounded bg-mozzarella-100 border border-basil-200 text-wood-800 placeholder-wood-400 outline-none focus:border-tomato-400 focus:ring-2 focus:ring-tomato-200" />
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full px-4 py-3 rounded bg-mozzarella-100 border border-basil-200 text-wood-800 placeholder-wood-400 outline-none focus:border-tomato-400 focus:ring-2 focus:ring-tomato-200" required />
          <button disabled={loading} className="w-full py-3 bg-tomato-600 text-white font-bold rounded hover:bg-tomato-700 transition-colors shadow-lg">{loading ? 'Creating...' : 'Create account'}</button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-wood-600 text-sm">
            Already have an account?{' '}
            <a href="/login" className="text-tomato-600 hover:text-tomato-700 font-semibold">Sign in</a>
          </p>
          <p className="text-wood-500 text-xs mt-3">
            Are you an administrator?{' '}
            <a href="/admin/login" className="text-wood-600 hover:text-wood-700 font-medium underline">Admin Login</a>
          </p>
        </div>
      </div>
    </div>
  )
}
