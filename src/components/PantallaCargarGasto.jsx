import { useState } from 'react'

export default function PantallaCargarGasto({ saldoDisponible, onVolver, onGuardar, persona }) {
  const [motivo, setMotivo] = useState('')
  const [monto, setMonto] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  async function confirmar() {
    const montoNum = Number(monto)
    if (!motivo.trim()) { setError('Escribí el motivo del gasto.'); return }
    if (!monto || montoNum <= 0) { setError('Ingresá un monto válido.'); return }
    if (montoNum > saldoDisponible) { setError(`El monto supera el saldo disponible ($${saldoDisponible.toLocaleString('es-AR')}).`); return }
    setGuardando(true)
    await onGuardar({ motivo: motivo.trim(), monto: montoNum, persona })
    setGuardando(false)
  }

  return (
    <div>
      <div className="top-bar">
        <button className="btn-volver" onClick={onVolver}>←</button>
        <h2>Cargar gasto</h2>
      </div>

      <div className="contenedor">
        <div style={{ background: 'var(--fondo-card)', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
          <p style={{ color: 'var(--gris)', fontSize: 13, margin: '0 0 2px' }}>Saldo disponible</p>
          <p style={{ color: 'var(--verde)', fontSize: 22, fontWeight: 500, margin: 0 }}>
            ${saldoDisponible.toLocaleString('es-AR')}
          </p>
        </div>

        <div className="campo">
          <label>Motivo del gasto</label>
          <input
            type="text"
            placeholder="Ej: Supermercado, Gas, Farmacia..."
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
            placeholder="Ej: 15000"
            value={monto}
            onChange={e => { setMonto(e.target.value); setError('') }}
          />
        </div>

        {error && <p style={{ color: 'var(--rojo)', fontSize: 13, margin: '-8px 0 12px' }}>{error}</p>}

        <p style={{ color: 'var(--gris)', fontSize: 13, margin: '0 0 16px' }}>
          Registrado por: <strong style={{ color: 'var(--blanco)' }}>{persona}</strong>
        </p>

        <button
          className="btn-principal"
          onClick={confirmar}
          disabled={!motivo.trim() || !monto || guardando}
        >
          {guardando ? 'Guardando...' : 'Confirmar gasto'}
        </button>
      </div>
    </div>
  )
}
