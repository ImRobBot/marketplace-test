export interface Department {
  label: string
  query: string
  code: string
  description: string
}

export const departments = [
  {
    label: 'Esenciales diarios',
    query: 'Esencial diario',
    code: '01',
    description: 'Soluciones prácticas para todos los días.'
  },
  {
    label: 'Selección especial',
    query: 'Selección especial',
    code: '02',
    description: 'Productos elegidos por diseño y utilidad.'
  },
  {
    label: 'Diseño funcional',
    query: 'Diseño funcional',
    code: '03',
    description: 'Objetos simples que hacen más con menos.'
  },
  {
    label: 'Nuevos favoritos',
    query: 'Nuevo favorito',
    code: '04',
    description: 'Descubrimientos recientes del catálogo.'
  }
] as const satisfies readonly Department[]
