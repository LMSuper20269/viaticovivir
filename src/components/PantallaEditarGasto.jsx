import { useState } from 'react'

export default function PantallaEditarGasto({ gasto, saldoDisponible, onVolver, onGuardar }) {
  const [motivo, setMotivo] = useState(gasto.motivo)
  const [monto, setMonto] = useState(String(gasto.monto))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const saldoMaximo = saldoDisponible + Number(gasto.monto)

  async function confirmar() {
    const montoNum = Number(monto)
    if (!motivo.trim()) { setError('Escribí el motivo.'); return }
    if (!monto || montoNum <= 0) { setError('Ingresá un monto válido.'); return }
    if (montoNum > saldoMaximo) {
      setError(`El monto máximo posible es $${saldoMaximo.toLocaleString('es-AR')}.`)
      return
    }
    setGuardando(true)
    await onGuardar(gasto, { motivo: motivo.trim(), monto: montoNum })
    setGuardando(false)
  }

  return (
    <div>
      <div className="top-bar">
        <button className="btn-volver" onClick={onVolver}>←</button>
        <h2>Editar gasto</h2>
      </div>

      <div className="contenedor">
        <div style={{ background: 'var(--fondo-card)', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
          <p style={{ color: 'var(--gris)', fontSize: 13, margin: '0 0 2px' }}>Saldo disponible (con este gasto devuelto)</p>
          <p style={{ color: 'var(--verde)', fontSize: 20, fontWeight: 600, margin: 0 }}>
            ${saldoMaximo.toLocaleString('es-AR')}
          </p>
        </div>

        <div className="campo">
          <label>Motivo del gasto</label>
          <input
            type="text"
            value={motivo}
            onChange={e => { setMotivo(e.target.value); setError('') }}
            autoFocus
          />
        </div>

        <div className="campo">
          <label>Monto</label>
          <input
            type="number"
            min="0"
            value={monto}
            onChange={e => { setMonto(e.target.value); setError('') }}
          />
        </div>

        {error && <p style={{ color: 'var(--rojo)', fontSize: 13, margin: '-8px 0 12px' }}>{error}</p>}

        <p style={{ color: 'var(--gris)', fontSize: 13, margin: '0 0 16px' }}>
          Cargado por: <strong style={{ color: 'var(--blanco)' }}>{gasto.persona}</strong>
        </p>

        <button
          className="btn-principal"
          onClick={confirmar}
          disabled={!motivo.trim() || !monto || guardando}
        >
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
