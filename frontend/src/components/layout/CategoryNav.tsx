import { Link, NavLink, type NavLinkRenderProps } from 'react-router-dom'
import { categoryLinks } from '../../data/navigation'

const navClass = ({ isActive }: NavLinkRenderProps): string => (
  `nav-link${isActive ? ' nav-link--active' : ''}`
)

export default function CategoryNav() {
  return (
    <nav className="category-nav" aria-label="Navegación del catálogo">
      <div className="page-shell category-nav__inner">
        <NavLink className={navClass} to="/" end>
          <span className="menu-icon" aria-hidden="true">☰</span> Todo
        </NavLink>
        {categoryLinks.map(link => (
          <Link className="category-nav__link" to={link.to} key={link.label}>
            {link.label}
          </Link>
        ))}
        <span className="category-nav__message">Compra clara, rápida y segura</span>
      </div>
    </nav>
  )
}
