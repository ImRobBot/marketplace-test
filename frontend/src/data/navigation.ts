interface NavigationLink {
  label: string
  to: string
}

export const categoryLinks = [
  { label: 'Esenciales', to: '/?q=Esencial%20diario#catalogo' },
  { label: 'Selección especial', to: '/?q=Selección%20especial#catalogo' },
  { label: 'Diseño funcional', to: '/?q=Diseño%20funcional#catalogo' },
  { label: 'Novedades', to: '/?q=Nuevo%20favorito#catalogo' }
] as const satisfies readonly NavigationLink[]
