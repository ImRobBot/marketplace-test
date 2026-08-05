import { Link } from 'react-router-dom'

interface BrandProps {
  footer?: boolean
  linkToHome?: boolean
}

function BrandContent() {
  return (
    <>
      <span className="brand__mark" aria-hidden="true">M</span>
      <span className="brand__name">Mercado <strong>Uno</strong></span>
    </>
  )
}

export default function Brand({ footer = false, linkToHome = false }: Readonly<BrandProps>) {
  const className = `brand${footer ? ' brand--footer' : ''}`

  if (linkToHome) {
    return (
      <Link className={className} to="/" aria-label="Mercado Uno, inicio">
        <BrandContent />
      </Link>
    )
  }

  return (
    <span className={className}>
      <BrandContent />
    </span>
  )
}
