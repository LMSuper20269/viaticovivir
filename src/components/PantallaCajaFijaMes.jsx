import { useState } from 'react'

function hoy() { return new Date().toISOString().split('T')[0] }

const NOMBRES_GRUPO = {
  a: 'Gastos Fijos Iniciales',
  b: 'Gastos Fijos Iniciales',
}

export default function PantallaCajaFijaMes({ gastosFijos, grupo, onVolver, onCrear }) {
  const items = gastosFijos.filter(g => g.grupo === grupo)
  const nombreGrupo = NOMBRES_GRUPO[grupo]

  const [montos, setMontos] = useState(() => {
    const m = {}
    items.forEach(g => { m[g.id] = g.monto_referencia ? String(g.monto_referencia) : '' })
    return m
  })
  const [guardando, setGuardando] = useState(false)

  const total = items.reduce((acc, g) => acc + Number(montos[g.id] || 0), 0)

  async function confirmar() {
    const itemsConMonto = items.map(g => ({
      id: g.id,
      nombre: g.nombre,
      monto: Number(montos[g.id] || 0),
    }))
    if (itemsConMonto.every(i => i.monto === 0)) return
    setGuardando(true)
    await onCrear({ items: itemsConMonto, total, fecha: hoy(), grupo, nombreGrupo })
    setGuardando(false)
  }

  return (
    <div>
      <div style={{ padding: '12px 16px 0' }}>
        <button className="btn-volver" onClick={onVolver}>←</button>
      </div>
      <div className="header">
        <p className="subt">Nueva caja del mes</p>
        <p className="titulo">{nombreGrupo}</p>
        <div className="fila-stats">
          <div className="stat-card">
            <p className="label">Items</p>
            <p className="valor" style={{ color: 'var(--blanco)' }}>{items.length}</p>
          </div>
          <div className="stat-card">
            <p className="label">Total estimado</p>
            <p className="valor" style={{ color: 'var(--amarillo)', fontSize: 16 }}>
              ${total.toLocaleString('es-AR')}
            </p>
          </div>
        </div>
      </div>

      <div className="contenedor">
        <p style={{ color: 'var(--gris)', fontSize: 13, marginBottom: 16 }}>
          Revisá y ajustá los montos de este mes. Los que dejes en $0 se crean igual como pendientes.
        </p>

        {items.map(g => (
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
              <input
                type="number" min="0" placeholder="$0"
                value={montos[g.id]}
                onChange={e => setMontos(prev => ({ ...prev, [g.id]: e.target.value }))}
                style={{ width: 120, padding: '10px 12px', background: 'var(--fondo-input)', border: '1px solid var(--borde)', borderRadius: 10, color: 'var(--blanco)', fontSize: 15, textAlign: 'right' }}
              />
            </div>
          </div>
        ))}

        <div style={{ background: 'var(--fondo-card)', borderRadius: 12, padding: '14px 16px', margin: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: 'var(--gris)', fontSize: 14, margin: 0 }}>Total estimado</p>
          <p style={{ color: 'var(--amarillo)', fontSize: 20, fontWeight: 700, margin: 0 }}>
            ${total.toLocaleString('es-AR')}
          </p>
        </div>

        <button className="btn-principal" onClick={confirmar} disabled={guardando}>
          {guardando ? 'Creando...' : `Crear caja ${nombreGrupo}`}
        </button>
      </div>
    </div>
  )
}
