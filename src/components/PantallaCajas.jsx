export default function PantallaCajas({ cajasActivas, gastosPorCaja, persona, onSeleccionar, onNuevaCaja, onVerArchivo, onCerrarSesion, onVerBalance }) {
  const totalDisponible = cajasActivas.reduce((acc, c) => acc + Number(c.saldo), 0)

  return (
    <div>
      <div className="header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p className="subt">Hola, {persona}</p>
            <p className="titulo">Viatico Vivir</p>
          </div>
          <button onClick={onCerrarSesion} style={{ background: 'none', border: 'none', color: 'var(--gris)', fontSize: 12, padding: 0 }}>
            ⎋ salir
          </button>
        </div>

        <div className="fila-stats">
          <div className="stat-card">
            <p className="label">Cajas activas</p>
            <p className="valor" style={{ color: 'var(--blanco)' }}>{cajasActivas.length}</p>
          </div>
          <div className="stat-card">
            <p className="label">Saldo total</p>
            <p className="valor" style={{ color: totalDisponible > 0 ? 'var(--verde)' : 'var(--rojo)' }}>
              ${totalDisponible.toLocaleString('es-AR')}
            </p>
          </div>
        </div>
      </div>

      <div className="contenedor">
        <button className="btn-principal" onClick={onNuevaCaja} style={{ marginBottom: 10 }}>
          + Nueva caja
        </button>

        <button onClick={onVerBalance} style={{
          width: '100%', background: 'var(--fondo-card)', color: 'var(--amarillo)',
          border: '1px solid var(--amarillo)', borderRadius: 12, padding: 14,
          fontSize: 15, fontWeight: 700, marginBottom: 16
        }}>
          📊 Balance ingresos / gastos
        </button>

        <p className="seccion-titulo">Cajas activas</p>

        {cajasActivas.length === 0 && (
          <div className="vacio">No hay cajas activas. Creá una nueva para empezar.</div>
        )}

        {cajasActivas.map(caja => {
          const gastos = gastosPorCaja[caja.id] || []
          const pct = Math.round((caja.saldo / caja.monto_inicial) * 100)
          const agotada = caja.saldo <= 0
          return (
            <div
              key={caja.id}
              onClick={() => onSeleccionar(caja)}
              style={{ background: 'var(--fondo-card)', borderRadius: 14, padding: '14px 16px', marginBottom: 10, cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <p style={{ color: 'var(--blanco)', fontSize: 16, fontWeight: 600, margin: '0 0 2px' }}>
                    {caja.descripcion || 'Viatico Vivir'}
                  </p>
                  <p style={{ color: 'var(--gris)', fontSize: 12, margin: 0 }}>
                    Desde {formatFecha(caja.fecha_inicio)} · {gastos.length} gastos
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: agotada ? 'var(--rojo)' : 'var(--verde)', fontSize: 18, fontWeight: 600, margin: '0 0 2px' }}>
                    ${Number(caja.saldo).toLocaleString('es-AR')}
                  </p>
                  <p style={{ color: 'var(--gris)', fontSize: 11, margin: 0 }}>
                    de ${Number(caja.monto_inicial).toLocaleString('es-AR')}
                  </p>
                </div>
              </div>
              <div style={{ background: 'var(--fondo)', borderRadius: 6, height: 6, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, 100 - pct)}%`,
                  background: agotada ? 'var(--rojo)' : pct < 25 ? 'var(--rojo)' : 'var(--verde)',
                  borderRadius: 6,
                }} />
              </div>
            </div>
          )
        })}

        <button className="btn-secundario" style={{ marginTop: 8 }} onClick={onVerArchivo}>
          📁 Ver cajas anteriores
        </button>
      </div>
    </div>
  )
}

function formatFecha(fecha) {
  if (!fecha) return ''
  const [y, m, d] = fecha.split('-')
  return `${d}/${m}/${y}`
}
