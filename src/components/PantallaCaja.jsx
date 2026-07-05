export default function PantallaCaja({ caja, gastos, onAgregarGasto, onCerrarCaja, onVerArchivo, onEditarCaja, onEliminarGasto }) {
  const saldoPorcentaje = Math.round((caja.saldo / caja.monto_inicial) * 100)
  const agotada = caja.saldo <= 0

  return (
    <div>
      <div className="header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p className="subt">Caja activa · desde {formatFecha(caja.fecha_inicio)}</p>
            <p className="titulo">{caja.descripcion || 'Viatico Vivir'}</p>
          </div>
          <button onClick={onEditarCaja} style={{ background: 'none', border: 'none', color: 'var(--amarillo)', fontSize: 14, fontWeight: 600, padding: '4px 0', marginTop: 4 }}>
            ✎ editar
          </button>
        </div>
        <div className="fila-stats">
          <div className="stat-card">
            <p className="label">Monto inicial</p>
            <p className="valor" style={{ color: 'var(--blanco)' }}>
              ${Number(caja.monto_inicial).toLocaleString('es-AR')}
            </p>
          </div>
          <div className="stat-card">
            <p className="label">Saldo disponible</p>
            <p className="valor" style={{ color: agotada ? 'var(--rojo)' : 'var(--verde)' }}>
              ${Number(caja.saldo).toLocaleString('es-AR')}
              {agotada && <span className="badge-agotada">Agotada</span>}
            </p>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: 'var(--gris)', fontSize: 12 }}>Gastado</span>
            <span style={{ color: 'var(--gris)', fontSize: 12 }}>{100 - saldoPorcentaje}%</span>
          </div>
          <div style={{ background: 'var(--fondo)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, 100 - saldoPorcentaje)}%`,
              background: agotada ? 'var(--rojo)' : saldoPorcentaje < 25 ? 'var(--rojo)' : 'var(--verde)',
              borderRadius: 6,
              transition: 'width 0.3s'
            }} />
          </div>
        </div>
      </div>

      <div className="contenedor">
        {!agotada && (
          <button className="btn-principal" onClick={onAgregarGasto} style={{ marginBottom: 10 }}>
            + Cargar gasto
          </button>
        )}

        <p className="seccion-titulo" style={{ marginTop: 8 }}>
          Gastos cargados ({gastos.length})
        </p>

        {gastos.length === 0 && (
          <div className="vacio">Todavía no hay gastos cargados en esta caja.</div>
        )}

        {gastos.map(g => (
          <div key={g.id} className="gasto-fila" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p className="gasto-motivo">{g.motivo}</p>
                <p className="gasto-meta">{g.persona} · {formatFechaHora(g.creado_en)}</p>
              </div>
              <p className="gasto-monto">-${Number(g.monto).toLocaleString('es-AR')}</p>
            </div>
            <button
              onClick={() => onEliminarGasto(g)}
              style={{ background: 'none', border: 'none', color: 'var(--rojo)', fontSize: 12, textAlign: 'right', padding: '2px 0' }}
            >
              🗑 eliminar
            </button>
          </div>
        ))}

        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn-secundario" onClick={onVerArchivo}>
            📁 Ver cajas anteriores
          </button>
          <button className="btn-peligro" onClick={onCerrarCaja}>
            Cerrar esta caja
          </button>
        </div>
      </div>
    </div>
  )
}

function formatFecha(fecha) {
  if (!fecha) return ''
  const [y, m, d] = fecha.split('-')
  return `${d}/${m}/${y}`
}

function formatFechaHora(ts) {
  if (!ts) return ''
  const f = new Date(ts)
  return f.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) +
    ' ' + f.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}
