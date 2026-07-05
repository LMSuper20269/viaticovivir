import { useState } from 'react'

export default function PantallaEditarCaja({ caja, onVolver, onGuardar }) {
  const [descripcion, setDescripcion] = useState(caja.descripcion || '')
  const [montoInicial, setMontoInicial] = useState(String(caja.monto_inicial))
  const [guardando, setGuardando] = useState(false)

  const gastoTotal = Number(caja.monto_inicial) - Number(caja.saldo)
  const nuevoSaldo = Math.max(0, Number(montoInicial) - gastoTotal)

  async function confirmar() {
    if (!montoInicial || Number(montoInicial) <= 0) return
    setGuardando(true)
    await onGuardar(caja.id, {
      descripcion: descripcion.trim() || 'Viatico Vivir',
      monto_inicial: Number(montoInicial),
      saldo: nuevoSaldo,
    })
    setGuardando(false)
  }

  return (
    <div>
      <div className="top-bar">
        <button className="btn-volver" onClick={onVolver}>←</button>
        <h2>Editar caja</h2>
      </div>

      <div className="contenedor">
        <div className="campo">
          <label>Descripción</label>
          <input
            type="text"
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            autoFocus
          />
        </div>

        <div className="campo">
          <label>Monto inicial</label>
          <input
            type="number"
            min="0"
            value={montoInicial}
            onChange={e => setMontoInicial(e.target.value)}
          />
        </div>

        {Number(montoInicial) > 0 && (
          <div style={{ background: 'var(--fondo-card)', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
            <p style={{ color: 'var(--gris)', fontSize: 13, margin: '0 0 4px' }}>Nuevo saldo que quedaría</p>
            <p style={{ color: nuevoSaldo > 0 ? 'var(--verde)' : 'var(--rojo)', fontSize: 20, fontWeight: 600, margin: 0 }}>
              ${nuevoSaldo.toLocaleString('es-AR')}
            </p>
            <p style={{ color: 'var(--gris)', fontSize: 12, margin: '4px 0 0' }}>
              (Monto inicial − gastos ya cargados: ${gastoTotal.toLocaleString('es-AR')})
            </p>
          </div>
        )}

        <button
          className="btn-principal"
          onClick={confirmar}
          disabled={!montoInicial || Number(montoInicial) <= 0 || guardando}
        >
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
