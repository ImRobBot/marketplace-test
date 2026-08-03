import AppRoutes from '../../app/AppRoutes'
import SiteFooter from './SiteFooter'
import SiteHeader from './SiteHeader'

export default function AppShell() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Saltar al contenido</a>
      <SiteHeader />
      <main id="main-content" className="app-main">
        <AppRoutes />
      </main>
      <SiteFooter />
    </div>
  )
}
