export default function PantallaCajas({ cajasActivas, gastosPorCaja, persona, onSeleccionar, onNuevaCaja, onVerArchivo, onCerrarSesion, onVerBalance, onGastosFijos, onCajaFijaMes }) {

  // Cajas fijas: las que tienen "Gastos fijos" en el nombre
  const cajasFijas = cajasActivas.filter(c => c.descripcion?.startsWith('Gastos fijos'))
  const cajasVariables = cajasActivas.filter(c => !c.descripcion?.startsWith('Gastos fijos'))

  // Saldo disponible = solo cajas variables
  const saldoDisponible = cajasVariables.reduce((acc, c) => acc + Number(c.saldo), 0)

  // Comprometido = pendientes de cajas fijas
  const comprometido = cajasFijas.reduce((acc, caja) => {
    const gastos = gastosPorCaja[caja.id] || []
    const pendientes = gastos.filter(g => g.estado === 'pendiente')
    return acc + pendientes.reduce((s, g) => s + Number(g.monto), 0)
  }, 0)

  const saldoNeto = saldoDisponible - comprometido

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

        {/* Resumen financiero */}
        <div className="fila-stats" style={{ marginBottom: 8 }}>
          <div className="stat-card">
            <p className="label">Disponible</p>
            <p className="valor" style={{ color: 'var(--verde)', fontSize: 18 }}>
              ${saldoDisponible.toLocaleString('es-AR')}
            </p>
          </div>
          <div className="stat-card">
            <p className="label">Comprometido fijos</p>
            <p className="valor" style={{ color: 'var(--amarillo)', fontSize: 18 }}>
              ${comprometido.toLocaleString('es-AR')}
            </p>
          </div>
        </div>

        <div style={{ background: 'var(--fondo)', borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: 'var(--gris)', fontSize: 13, margin: 0 }}>Saldo real neto</p>
          <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color: saldoNeto >= 0 ? 'var(--verde)' : 'var(--rojo)' }}>
            {saldoNeto >= 0 ? '+' : ''}${saldoNeto.toLocaleString('es-AR')}
          </p>
        </div>
      </div>

      <div className="contenedor">
        <button className="btn-principal" onClick={onNuevaCaja} style={{ marginBottom: 8 }}>
          + Nueva caja
        </button>

        <button onClick={onCajaFijaMes} style={{
          width: '100%', background: 'var(--fondo-card)', color: 'var(--blanco)',
          border: '1px solid var(--borde)', borderRadius: 12, padding: 14,
          fontSize: 15, fontWeight: 600, marginBottom: 8
        }}>
          📋 Crear caja de gastos fijos del mes
        </button>

        <button onClick={onVerBalance} style={{
          width: '100%', background: 'var(--fondo-card)', color: 'var(--amarillo)',
          border: '1px solid var(--amarillo)', borderRadius: 12, padding: 14,
          fontSize: 15, fontWeight: 700, marginBottom: 16
        }}>
          📊 Balance ingresos / gastos
        </button>

        {/* Cajas fijas */}
        {cajasFijas.length > 0 && (
          <>
            <p className="seccion-titulo">Gastos fijos del mes</p>
            {cajasFijas.map(caja => {
              const gastos = gastosPorCaja[caja.id] || []
              const pendientes = gastos.filter(g => g.estado === 'pendiente')
              const pagados = gastos.filter(g => g.estado !== 'pendiente')
              const totalPendiente = pendientes.reduce((acc, g) => acc + Number(g.monto), 0)
              const totalPagado = pagados.reduce((acc, g) => acc + Number(g.monto), 0)
              return (
                <div key={caja.id} onClick={() => onSeleccionar(caja)}
                  style={{ background: 'var(--fondo-card)', borderRadius: 14, padding: '14px 16px', marginBottom: 10, cursor: 'pointer', borderLeft: '3px solid var(--amarillo)' }}>
                  <p style={{ color: 'var(--blanco)', fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>
                    {caja.descripcion}
                  </p>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div>
                      <p style={{ color: 'var(--gris)', fontSize: 11, margin: '0 0 2px' }}>Pagado</p>
                      <p style={{ color: 'var(--verde)', fontSize: 14, fontWeight: 600, margin: 0 }}>
                        ${totalPagado.toLocaleString('es-AR')}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--gris)', fontSize: 11, margin: '0 0 2px' }}>Pendiente</p>
                      <p style={{ color: 'var(--amarillo)', fontSize: 14, fontWeight: 600, margin: 0 }}>
                        ${totalPendiente.toLocaleString('es-AR')}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--gris)', fontSize: 11, margin: '0 0 2px' }}>Items</p>
                      <p style={{ color: 'var(--gris)', fontSize: 14, fontWeight: 600, margin: 0 }}>
                        {pagados.length}/{gastos.length}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}

        {/* Cajas variables */}
        {cajasVariables.length > 0 && (
          <>
            <p className="seccion-titulo">Cajas activas</p>
            {cajasVariables.map(caja => {
              const gastos = gastosPorCaja[caja.id] || []
              const pct = caja.monto_inicial > 0 ? Math.round((caja.saldo / caja.monto_inicial) * 100) : 0
              const agotada = caja.saldo <= 0
              return (
                <div key={caja.id} onClick={() => onSeleccionar(caja)}
                  style={{ background: 'var(--fondo-card)', borderRadius: 14, padding: '14px 16px', marginBottom: 10, cursor: 'pointer' }}>
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
          </>
        )}

        {cajasActivas.length === 0 && (
          <div className="vacio">No hay cajas activas. Creá una nueva para empezar.</div>
        )}

        <button className="btn-secundario" style={{ marginTop: 8 }} onClick={onVerArchivo}>
          📁 Ver cajas anteriores
        </button>
        <button className="btn-secundario" style={{ marginTop: 8 }} onClick={onGastosFijos}>
          ⚙️ Configurar gastos fijos
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
