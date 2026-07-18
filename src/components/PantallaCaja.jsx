import { useState } from 'react'

export default function PantallaCaja({ caja, gastos, persona, onAgregarGasto, onCerrarCaja, onVerArchivo, onEditarCaja, onEliminarGasto, onEditarGasto, onConfirmarPago, onCerrarSesion, onVolver, onInicio }) {
  const [confirmando, setConfirmando] = useState(null)
  const [montoConfirm, setMontoConfirm] = useState('')

  const saldoPorcentaje = Math.round((caja.saldo / caja.monto_inicial) * 100)
  const agotada = caja.saldo <= 0

  const pendientes = gastos.filter(g => g.estado === 'pendiente')
  const pagados = gastos.filter(g => g.estado !== 'pendiente')

  function abrirConfirmar(g) {
    setConfirmando(g)
    setMontoConfirm(String(g.monto))
  }

  async function guardarPago() {
    if (!montoConfirm || Number(montoConfirm) <= 0) return
    await onConfirmarPago(confirmando, Number(montoConfirm), persona)
    setConfirmando(null)
    setMontoConfirm('')
  }

  return (
    <div>
      <div style={{ padding: '12px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn-volver" onClick={onVolver}>←</button>
        <button onClick={onInicio} style={{
          background: 'var(--fondo-card)', border: '1px solid var(--borde)',
          color: 'var(--blanco)', borderRadius: 20, padding: '6px 16px',
          fontSize: 13, fontWeight: 600
        }}>
          🏠 Inicio
        </button>
      </div>
      <div className="header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p className="subt">Caja activa · desde {formatFecha(caja.fecha_inicio)}</p>
            <p className="titulo">{caja.descripcion || 'Viatico Vivir'}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <button onClick={onEditarCaja} style={{ background: 'none', border: 'none', color: 'var(--amarillo)', fontSize: 14, fontWeight: 600, padding: 0 }}>✎ editar</button>
            <button onClick={onCerrarSesion} style={{ background: 'none', border: 'none', color: 'var(--gris)', fontSize: 12, padding: 0 }}>⎋ salir</button>
          </div>
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
            <span style={{ color: 'var(--gris)', fontSize: 12 }}>{Math.min(100, 100 - saldoPorcentaje)}%</span>
          </div>
          <div style={{ background: 'var(--fondo)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, 100 - saldoPorcentaje)}%`,
              background: agotada ? 'var(--rojo)' : saldoPorcentaje < 25 ? 'var(--rojo)' : 'var(--verde)',
              borderRadius: 6, transition: 'width 0.3s'
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

        {/* Modal confirmar pago */}
        {confirmando && (
          <div style={{ background: 'var(--fondo-card)', border: '1px solid var(--amarillo)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <p style={{ color: 'var(--amarillo)', fontWeight: 700, fontSize: 15, margin: '0 0 4px' }}>Confirmar pago</p>
            <p style={{ color: 'var(--blanco)', fontSize: 14, margin: '0 0 12px' }}>{confirmando.motivo}</p>
            <div className="campo">
              <label>Monto abonado</label>
              <input type="number" min="0" value={montoConfirm}
                onChange={e => setMontoConfirm(e.target.value)} autoFocus />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-principal" onClick={guardarPago}
                disabled={!montoConfirm || Number(montoConfirm) <= 0}
                style={{ flex: 1 }}>
                ✓ Confirmar
              </button>
              <button className="btn-secundario" onClick={() => setConfirmando(null)}
                style={{ flex: 1 }}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Pendientes */}
        {pendientes.length > 0 && (
          <>
            <p className="seccion-titulo">Pendientes de pago ({pendientes.length})</p>
            {pendientes.map(g => (
              <div key={g.id} style={{ background: 'var(--fondo-card)', borderRadius: 12, padding: '12px 14px', marginBottom: 8, borderLeft: '3px solid var(--amarillo)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p className="gasto-motivo">{g.motivo}</p>
                    <p className="gasto-meta">Monto estimado: ${Number(g.monto).toLocaleString('es-AR')}</p>
                  </div>
                  <button onClick={() => abrirConfirmar(g)} style={{
                    background: 'var(--amarillo)', color: '#1a1a1a', border: 'none',
                    borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 700
                  }}>
                    Pagar
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => onEditarGasto(g)} style={{ background: 'none', border: 'none', color: 'var(--amarillo)', fontSize: 12, padding: 0 }}>✎ editar monto</button>
                  <button onClick={() => onEliminarGasto(g)} style={{ background: 'none', border: 'none', color: 'var(--rojo)', fontSize: 12, padding: 0 }}>🗑 eliminar</button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Pagados */}
        <p className="seccion-titulo" style={{ marginTop: pendientes.length > 0 ? 16 : 8 }}>
          Pagados ({pagados.length})
        </p>
        {pagados.length === 0 && <div className="vacio">Todavía no hay gastos pagados.</div>}
        {pagados.map(g => (
          <div key={g.id} className="gasto-fila" style={{ flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p className="gasto-motivo">{g.motivo}</p>
                <p className="gasto-meta">{g.persona} · {formatFechaHora(g.creado_en)}</p>
              </div>
              <p className="gasto-monto">-${Number(g.monto).toLocaleString('es-AR')}</p>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => onEditarGasto(g)} style={{ background: 'none', border: 'none', color: 'var(--amarillo)', fontSize: 12, padding: 0 }}>✎ editar</button>
              <button onClick={() => onEliminarGasto(g)} style={{ background: 'none', border: 'none', color: 'var(--rojo)', fontSize: 12, padding: 0 }}>🗑 eliminar</button>
            </div>
          </div>
        ))}

        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn-secundario" onClick={onVerArchivo}>📁 Ver cajas anteriores</button>
          <button className="btn-peligro" onClick={onCerrarCaja}>Cerrar esta caja</button>
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
