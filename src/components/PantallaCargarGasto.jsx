import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function PantallaCargarGasto({ saldoDisponible, onVolver, onGuardar, persona, cajaId }) {
  const [motivo, setMotivo] = useState('')
  const [monto, setMonto] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [motivosGuardados, setMotivosGuardados] = useState([])
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)

  useEffect(() => {
    cargarMotivos()
  }, [])

  async function cargarMotivos() {
    const { data } = await supabase
      .from('gastos')
      .select('motivo')
      .order('creado_en', { ascending: false })

    if (data) {
      const unicos = [...new Set(data.map(g => g.motivo))]
      setMotivosGuardados(unicos)
    }
  }

  const sugerencias = motivo.length > 0
    ? motivosGuardados.filter(m => m.toLowerCase().includes(motivo.toLowerCase()) && m !== motivo)
    : motivosGuardados

  function elegirSugerencia(m) {
    setMotivo(m)
    setMostrarSugerencias(false)
    setError('')
  }

  async function confirmar() {
    const montoNum = Number(monto)
    if (!motivo.trim()) { setError('Escribí el motivo del gasto.'); return }
    if (!monto || montoNum <= 0) { setError('Ingresá un monto válido.'); return }
    if (montoNum > saldoDisponible) { setError(`El monto supera el saldo disponible ($${saldoDisponible.toLocaleString('es-AR')}).`); return }
    setGuardando(true)
    await onGuardar({ motivo: motivo.trim(), monto: montoNum, persona, cajaId })
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
            onChange={e => { setMotivo(e.target.value); setError(''); setMostrarSugerencias(true) }}
            onFocus={() => setMostrarSugerencias(true)}
            autoFocus
          />

          {mostrarSugerencias && sugerencias.length > 0 && (
            <div style={{ border: '1px solid var(--borde)', borderRadius: 10, marginTop: 4, background: 'var(--fondo-card)', maxHeight: 200, overflowY: 'auto' }}>
              {motivosGuardados.length > 0 && motivo.length === 0 && (
                <p style={{ color: 'var(--gris)', fontSize: 11, padding: '6px 14px 2px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Usados antes
                </p>
              )}
              {sugerencias.map(s => (
                <div
                  key={s}
                  onClick={() => elegirSugerencia(s)}
                  style={{ padding: '10px 14px', fontSize: 15, color: 'var(--blanco)', borderBottom: '1px solid var(--borde)', cursor: 'pointer' }}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="campo">
          <label>Monto</label>
          <input
            type="number"
            min="0"
            placeholder="Ej: 15000"
            value={monto}
            onChange={e => { setMonto(e.target.value); setError(''); setMostrarSugerencias(false) }}
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
