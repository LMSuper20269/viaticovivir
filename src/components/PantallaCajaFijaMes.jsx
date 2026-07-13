import { useState } from 'react'

function mesActual() {
  const d = new Date()
  return d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
}

function hoy() { return new Date().toISOString().split('T')[0] }

export default function PantallaCajaFijaMes({ gastosFijos, onVolver, onCrear }) {
  const [montos, setMontos] = useState(() => {
    const m = {}
    gastosFijos.forEach(g => { m[g.id] = g.monto_referencia ? String(g.monto_referencia) : '' })
    return m
  })
  const [guardando, setGuardando] = useState(false)

  const total = gastosFijos.reduce((acc, g) => acc + Number(montos[g.id] || 0), 0)

  async function confirmar() {
    const items = gastosFijos.map(g => ({
      nombre: g.nombre,
      monto: Number(montos[g.id] || 0),
    })).filter(g => g.monto > 0)

    const montosIds = gastosFijos.map(g => ({
      id: g.id,
      monto: Number(montos[g.id] || 0),
    }))

    if (items.length === 0) return
    setGuardando(true)
    await onCrear({ items, total, fecha: hoy(), montosIds })
    setGuardando(false)
  }

  return (
    <div>
      <div style={{ padding: '12px 16px 0' }}>
        <button className="btn-volver" onClick={onVolver}>←</button>
      </div>
      <div className="header">
        <p className="subt">Nueva caja automática</p>
        <p className="titulo">Gastos fijos — {mesActual()}</p>
        <div className="fila-stats">
          <div className="stat-card">
            <p className="label">Items</p>
            <p className="valor" style={{ color: 'var(--blanco)' }}>{gastosFijos.length}</p>
          </div>
          <div className="stat-card">
            <p className="label">Total del mes</p>
            <p className="valor" style={{ color: 'var(--amarillo)', fontSize: 16 }}>
              ${total.toLocaleString('es-AR')}
            </p>
          </div>
        </div>
      </div>

      <div className="contenedor">
        <p style={{ color: 'var(--gris)', fontSize: 13, marginBottom: 16 }}>
          Completá el monto de cada gasto fijo para este mes. Podés dejarlo en cero si no aplica.
        </p>

        {gastosFijos.map(g => (
          <div key={g.id} style={{ background: 'var(--fondo-card)', borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <p style={{ color: 'var(--blanco)', fontSize: 15, fontWeight: 600, margin: 0 }}>{g.nombre}</p>
                {g.monto_referencia > 0 && (
                  <p style={{ color: 'var(--gris)', fontSize: 11, margin: '2px 0 0' }}>
                    Mes anterior: ${Number(g.monto_referencia).toLocaleString('es-AR')}
                  </p>
                )}
              </div>
              <div style={{ width: 130 }}>
                <input
                  type="number"
                  min="0"
                  placeholder="$ monto"
                  value={montos[g.id]}
                  onChange={e => setMontos(prev => ({ ...prev, [g.id]: e.target.value }))}
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: 'var(--fondo-input)', border: '1px solid var(--borde)',
                    borderRadius: 10, color: 'var(--blanco)', fontSize: 15, textAlign: 'right'
                  }}
                />
              </div>
            </div>
          </div>
        ))}

        <div style={{ background: 'var(--fondo-card)', borderRadius: 12, padding: '14px 16px', margin: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: 'var(--gris)', fontSize: 14, margin: 0 }}>Total de la caja</p>
          <p style={{ color: 'var(--amarillo)', fontSize: 20, fontWeight: 700, margin: 0 }}>
            ${total.toLocaleString('es-AR')}
          </p>
        </div>

        <button className="btn-principal" onClick={confirmar} disabled={total === 0 || guardando}>
          {guardando ? 'Creando...' : 'Crear caja de gastos fijos'}
        </button>
      </div>
    </div>
  )
}
