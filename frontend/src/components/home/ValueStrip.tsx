const values = [
  { icon: '✓', title: 'Disponibilidad visible', description: 'Consulta el inventario antes de elegir.' },
  { icon: '$', title: 'Precios transparentes', description: 'El total siempre está a la vista.' },
  { icon: 'M', title: 'Compra de práctica', description: 'Prueba el flujo sin cargos reales.' }
] as const

export default function ValueStrip() {
  return (
    <section className="page-shell value-strip" aria-label="Por qué comprar aquí">
      {values.map(value => (
        <div className="value-strip__item" key={value.title}>
          <span className="value-strip__icon" aria-hidden="true">{value.icon}</span>
          <div><strong>{value.title}</strong><p>{value.description}</p></div>
        </div>
      ))}
    </section>
  )
}
