import { useState } from 'react'

export default function PantallaNewCaja({ onVolver, onGuardar }) {
  const [descripcion, setDescripcion] = useState('Gastos del hogar')
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(hoy())
  const [guardando, setGuardando] = useState(false)

  async function confirmar() {
    if (!monto || Number(monto) <= 0) return
    setGuardando(true)
    await onGuardar({ descripcion: descripcion.trim() || 'Gastos del hogar', monto: Number(monto), fecha })
    setGuardando(false)
  }

  return (
    <div>
      <div className="top-bar">
        <button className="btn-volver" onClick={onVolver}>←</button>
        <h2>Nueva caja</h2>
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
            placeholder="Ej: 150000"
            value={monto}
            onChange={e => setMonto(e.target.value)}
          />
        </div>

        <div className="campo">
          <label>Fecha de inicio</label>
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
          />
        </div>

        <button
          className="btn-principal"
          onClick={confirmar}
          disabled={!monto || Number(monto) <= 0 || guardando}
        >
          {guardando ? 'Creando...' : 'Crear caja'}
        </button>
      </div>
    </div>
  )
}

function hoy() {
  return new Date().toISOString().split('T')[0]
}
