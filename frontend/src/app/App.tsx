import { BrowserRouter } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'
import { AuthProvider } from '../context/AuthContext'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  )
}
