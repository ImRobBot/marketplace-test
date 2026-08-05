import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import AuthLayout from './auth/AuthLayout'
import AuthStory from './auth/AuthStory'
import CredentialsForm from './auth/CredentialsForm'
import CartHeader from './cart/CartHeader'
import CartItemCard from './cart/CartItemCard'
import OrderSummary from './cart/OrderSummary'
import QuantityControl from './cart/QuantityControl'
import Brand from './common/Brand'
import EmptyState from './common/EmptyState'
import FeedbackNotice from './common/FeedbackNotice'
import DepartmentSection from './home/DepartmentSection'
import HomeHero from './home/HomeHero'
import ProductCard from './home/ProductCard'
import ProductGrid from './home/ProductGrid'
import CategoryNav from './layout/CategoryNav'
import HeaderSearch from './layout/HeaderSearch'
import SiteFooter from './layout/SiteFooter'
import ProductBuyBox from './product/ProductBuyBox'
import ProductDetailInfo from './product/ProductDetailInfo'
import ProductVisual from './product/ProductVisual'
import CatalogSection from './home/CatalogSection'
import type { Product, Feedback, CartItem } from '../types'
import { getProductMeta } from '../lib/products'

afterEach(cleanup)

const product: Product = {
  id: 1,
  title: 'Producto A',
  price: 9.99,
  stock: 5,
  description: 'Producto para pruebas'
}

const cartItem: CartItem = {
  productId: product.id,
  qty: 2,
  product
}

function withRouter(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('presentational components', () => {
  it('renders the brand in text and link variants', () => {
    const { rerender } = withRouter(<Brand linkToHome />)

    expect(screen.getByRole('link', { name: /mercado uno/i })).toHaveAttribute('href', '/')

    rerender(<MemoryRouter><Brand footer /></MemoryRouter>)
    expect(screen.queryByRole('link', { name: /mercado uno/i })).not.toBeInTheDocument()
    expect(screen.getByText('Mercado')).toBeInTheDocument()
  })

  it('renders an empty state with configurable semantic elements', () => {
    withRouter(
      <EmptyState
        as="section"
        headingAs="h1"
        bordered={false}
        className="custom-state"
        icon="!"
        iconClassName="custom-icon"
        eyebrow="Aviso"
        title="Sin resultados"
        description="Prueba otro filtro"
        role="status"
        actions={<button type="button">Reintentar</button>}
      />
    )

    const state = screen.getByRole('status')
    expect(state.tagName).toBe('SECTION')
    expect(state).toHaveClass('custom-state')
    expect(screen.getByRole('heading', { level: 1, name: 'Sin resultados' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('renders success and error feedback with native semantics', () => {
    const { container, rerender } = withRouter(<FeedbackNotice feedback={null} />)
    expect(container).toBeEmptyDOMElement()

    const success: Feedback = { type: 'success', message: 'Guardado' }
    rerender(
      <MemoryRouter>
        <FeedbackNotice feedback={success} actionLabel="Ver carrito" actionTo="/cart" />
      </MemoryRouter>
    )
    expect(container.querySelector('output')).toHaveTextContent('Guardado')
    expect(screen.getByRole('link', { name: 'Ver carrito' })).toHaveAttribute('href', '/cart')

    rerender(
      <MemoryRouter>
        <FeedbackNotice feedback={{ type: 'error', message: 'Falló' }} />
      </MemoryRouter>
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Falló')
  })

  it('renders authentication layout, story and form interactions', () => {
    const onUsernameChange = vi.fn()
    const onPasswordChange = vi.fn()
    const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => event.preventDefault())

    withRouter(
      <AuthLayout
        eyebrow="Login"
        title="Bienvenido"
        titleId="auth-title"
        lead="Continúa"
        error="Credenciales inválidas"
        footer={<a href="/register">Crear cuenta</a>}
        story={(
          <AuthStory
            art="A"
            eyebrow="Beneficios"
            title="Compra fácil"
            benefits={['Carrito persistente', 'Stock visible']}
          />
        )}
      >
        <CredentialsForm
          idPrefix="login"
          username=""
          password=""
          usernamePlaceholder="Usuario"
          passwordPlaceholder="Contraseña"
          passwordAutoComplete="current-password"
          passwordHint="Mínimo doce caracteres"
          submitting={false}
          hasError
          submitLabel="Entrar"
          submittingLabel="Ingresando"
          onUsernameChange={onUsernameChange}
          onPasswordChange={onPasswordChange}
          onSubmit={onSubmit}
        />
      </AuthLayout>
    )

    expect(screen.getByRole('heading', { name: 'Bienvenido' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Credenciales inválidas')
    expect(screen.getByText('Carrito persistente')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: 'ana' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'secret' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Entrar' }).closest('form') as HTMLFormElement)

    expect(onUsernameChange).toHaveBeenCalledWith('ana')
    expect(onPasswordChange).toHaveBeenCalledWith('secret')
    expect(onSubmit).toHaveBeenCalled()
  })

  it('supports cart controls and actions', () => {
    const onRemove = vi.fn()
    const onQuantityChange = vi.fn()
    const onCheckout = vi.fn()

    withRouter(
      <>
        <CartHeader authenticated units={1} />
        <QuantityControl
          title={product.title}
          quantity={2}
          maxStock={5}
          busy={false}
          onChange={onQuantityChange}
        />
        <CartItemCard
          item={cartItem}
          pendingAction=""
          onRemove={onRemove}
          onQuantityChange={onQuantityChange}
        />
        <OrderSummary
          summary={{ units: 2, total: 19.98 }}
          processing={false}
          onCheckout={onCheckout}
        />
      </>
    )

    expect(screen.getByRole('heading', { name: 'Carrito' })).toBeInTheDocument()
    expect(screen.getAllByRole('group', { name: /cantidad/i })).toHaveLength(2)
    const increaseButtons = screen.getAllByRole('button', { name: /aumentar cantidad/i })
    fireEvent.click(increaseButtons[0]!)
    fireEvent.click(increaseButtons[1]!)
    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }))
    fireEvent.click(screen.getByRole('button', { name: /pagar ahora/i }))

    expect(onQuantityChange).toHaveBeenCalledWith(3)
    expect(onQuantityChange).toHaveBeenCalledWith(product.id, 3)
    expect(onRemove).toHaveBeenCalledWith(product.id, product.title)
    expect(onCheckout).toHaveBeenCalled()
  })

  it('renders product and home states', () => {
    const onAdd = vi.fn()
    const onClear = vi.fn()
    const onRetry = vi.fn()
    const onSelect = vi.fn()

    withRouter(
      <>
        <HomeHero authenticated loading={false} productCount={2} />
        <DepartmentSection
          departments={[{
            label: 'Esenciales',
            query: 'esencial',
            code: '01',
            description: 'Útiles'
          }]}
          activeQuery="esencial"
          onSelect={onSelect}
          onClear={onClear}
        />
        <ProductGrid
          products={[product]}
          loading={false}
          error=""
          addingId={null}
          authenticated
          onClear={onClear}
          onRetry={onRetry}
          onAdd={onAdd}
        />
        <ProductDetailInfo
          product={product}
          meta={getProductMeta(product.id)}
          outOfStock={false}
        />
        <ProductVisual product={product} compact />
      </>
    )

    expect(screen.getByRole('heading', { name: /todo lo que buscas/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ver todo' }))
    fireEvent.click(screen.getByRole('button', { name: /esenciales/i }))
    fireEvent.click(screen.getByRole('button', { name: /añadir .*carrito/i }))

    expect(onClear).toHaveBeenCalled()
    expect(onSelect).toHaveBeenCalledWith('esencial')
    expect(onAdd).toHaveBeenCalledWith(product)
    expect(screen.getAllByRole('img').length).toBeGreaterThan(0)
  })

  it('covers loading, error and empty product grid branches', () => {
    const onClear = vi.fn()
    const onRetry = vi.fn()
    const { rerender } = withRouter(
      <ProductGrid
        products={[]}
        loading
        error=""
        addingId={null}
        authenticated={false}
        onClear={onClear}
        onRetry={onRetry}
        onAdd={vi.fn()}
      />
    )
    expect(screen.getByLabelText('Cargando productos')).toBeInTheDocument()

    rerender(
      <MemoryRouter>
        <ProductGrid
          products={[]}
          loading={false}
          error="No disponible"
          addingId={null}
          authenticated={false}
          onClear={onClear}
          onRetry={onRetry}
          onAdd={vi.fn()}
        />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: /volver a intentar/i }))
    expect(onRetry).toHaveBeenCalled()

    rerender(
      <MemoryRouter>
        <ProductGrid
          products={[]}
          loading={false}
          error=""
          addingId={null}
          authenticated={false}
          onClear={onClear}
          onRetry={onRetry}
          onAdd={vi.fn()}
        />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: /limpiar b/i }))
    expect(onClear).toHaveBeenCalled()
  })

  it('covers catalog filtering and pagination callbacks', () => {
    const onQueryChange = vi.fn()
    const onClear = vi.fn()
    const onPageChange = vi.fn()

    withRouter(
      <CatalogSection
        products={[product]}
        totalResults={20}
        currentPage={1}
        pageSize={12}
        loading={false}
        error=""
        query="producto"
        feedback={{ type: 'success', message: 'Añadido' }}
        addingId={null}
        authenticated
        onQueryChange={onQueryChange}
        onClear={onClear}
        onRetry={vi.fn()}
        onAdd={vi.fn()}
        onPageChange={onPageChange}
      />
    )

    fireEvent.change(screen.getByPlaceholderText('Filtrar resultados'), {
      target: { value: 'nuevo' }
    })
    fireEvent.click(screen.getByRole('button', { name: /limpiar filtro/i }))
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))

    expect(onQueryChange).toHaveBeenCalledWith('nuevo')
    expect(onClear).toHaveBeenCalled()
    expect(onPageChange).toHaveBeenCalledWith(2)
    expect(screen.getByText('Añadido')).toBeInTheDocument()
  })

  it('covers buy box states and quantity updates', () => {
    const onQuantityChange = vi.fn()
    const onAdd = vi.fn()
    const { rerender } = withRouter(
      <ProductBuyBox
        product={product}
        productId="1"
        authenticated
        outOfStock={false}
        quantity={1}
        adding={false}
        feedback={null}
        onQuantityChange={onQuantityChange}
        onAdd={onAdd}
      />
    )

    fireEvent.change(screen.getByLabelText('Cantidad'), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: /añadir al carrito/i }))
    expect(onQuantityChange).toHaveBeenCalledWith(3)
    expect(onAdd).toHaveBeenCalledWith(product)

    rerender(
      <MemoryRouter>
        <ProductBuyBox
          product={{ ...product, stock: 0 }}
          productId="1"
          authenticated
          outOfStock
          quantity={1}
          adding
          feedback={{ type: 'success', message: 'Listo' }}
          onQuantityChange={onQuantityChange}
          onAdd={onAdd}
        />
      </MemoryRouter>
    )
    expect(screen.getByRole('button', { name: /añadiendo/i })).toBeDisabled()

    rerender(
      <MemoryRouter>
        <ProductBuyBox
          product={product}
          productId="1"
          authenticated={false}
          outOfStock={false}
          quantity={1}
          adding={false}
          feedback={null}
          onQuantityChange={onQuantityChange}
          onAdd={onAdd}
        />
      </MemoryRouter>
    )
    expect(screen.getByRole('link', { name: /inicia sesi/i })).toHaveAttribute('href', '/login')
  })

  it('covers search, navigation and footer links', () => {
    const onQueryChange = vi.fn()
    const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => event.preventDefault())

    withRouter(
      <>
        <HeaderSearch query="" onQueryChange={onQueryChange} onSubmit={onSubmit} />
        <CategoryNav />
        <SiteFooter />
      </>
    )

    fireEvent.change(screen.getByPlaceholderText('Buscar en Mercado Uno'), {
      target: { value: 'lámpara' }
    })
    fireEvent.submit(screen.getByRole('search'))

    expect(onQueryChange).toHaveBeenCalledWith('lámpara')
    expect(onSubmit).toHaveBeenCalled()
    expect(screen.getByRole('navigation', { name: /navegaci/i })).toBeInTheDocument()
    expect(screen.getByText('Compra clara, rápida y segura')).toBeInTheDocument()
    expect(screen.getByText('Demo interactiva · 2026')).toBeInTheDocument()
  })
})
