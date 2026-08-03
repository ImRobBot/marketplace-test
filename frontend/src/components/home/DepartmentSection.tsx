import type { Department } from '../../data/departments'

interface DepartmentSectionProps {
  departments: readonly Department[]
  activeQuery: string
  onSelect: (query: string) => void
  onClear: () => void
}

export default function DepartmentSection({
  departments,
  activeQuery,
  onSelect,
  onClear
}: DepartmentSectionProps) {
  return (
    <section className="page-shell department-section" aria-labelledby="department-title">
      <div className="department-section__heading">
        <div>
          <span className="eyebrow">Compra por categoría</span>
          <h2 id="department-title">Explora departamentos</h2>
        </div>
        <button type="button" className="text-button" onClick={onClear}>Ver todo</button>
      </div>
      <div className="department-grid">
        {departments.map(department => (
          <button
            className="department-card"
            type="button"
            key={department.code}
            aria-pressed={activeQuery === department.query}
            onClick={() => onSelect(department.query)}
          >
            <span className="department-card__visual" aria-hidden="true">
              <span>{department.code}</span>
            </span>
            <span className="department-card__copy">
              <strong>{department.label}</strong>
              <small>{department.description}</small>
              <span>Ver productos →</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
