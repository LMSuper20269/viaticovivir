import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function PantallaGastosFijos({ onVolver }) {
  const [items, setItems] = useState([])
  const [mostrando, setMostrando] = useState(false)
  const [nombre, setNombre] = useState('')
  const [montoRef, setMontoRef] = useState('')
  const [editando, setEditando] = useState(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    const { data } = await supabase
      .from('gastos_fijos').select('*').order('nombre', { ascending: true })
    if (data) setItems(data)
  }

  async function guardar() {
    if (!nombre.trim()) return
    setGuardando(true)
    if (editando) {
      await supabase.from('gastos_fijos').update({
        nombre: nombre.trim(),
        monto_referencia: montoRef ? Number(montoRef) : null,
      }).eq('id', editando.id)
    } else {
      await supabase.from('gastos_fijos').insert({
        nombre: nombre.trim(),
        monto_referencia: montoRef ? Number(montoRef) : null,
        orden: items.length,
      })
    }
    setNombre(''); setMontoRef(''); setEditando(null); setMostrando(false)
    setGuardando(false)
    cargar()
  }

  function iniciarEdicion(item) {
    setEditando(item)
    setNombre(item.nombre)
    setMontoRef(item.monto_referencia ? String(item.monto_referencia) : '')
    setMostrando(true)
  }

  async function toggleActivo(item) {
    await supabase.from('gastos_fijos').update({ activo: !item.activo }).eq('id', item.id)
    cargar()
  }

  async function eliminar(item) {
    const ok = window.confirm(`¿Eliminar "${item.nombre}" de los gastos fijos?`)
    if (!ok) return
    await supabase.from('gastos_fijos').delete().eq('id', item.id)
    cargar()
  }

  const activos = items.filter(i => i.activo)
  const totalReferencia = activos.reduce((acc, i) => acc + Number(i.monto_referencia || 0), 0)

  return (
    <div>
      <div style={{ padding: '12px 16px 0' }}>
        <button className="btn-volver" onClick={onVolver}>←</button>
      </div>
      <div className="header">
        <p className="subt">Plantilla mensual</p>
        <p className="titulo">Gastos fijos</p>
        <div className="fila-stats">
          <div className="stat-card">
            <p className="label">Items activos</p>
            <p className="valor" style={{ color: 'var(--blanco)' }}>{activos.length}</p>
          </div>
          <div className="stat-card">
            <p className="label">Total referencia</p>
            <p className="valor" style={{ color: 'var(--amarillo)', fontSize: 16 }}>
              {totalReferencia > 0 ? `$${totalReferencia.toLocaleString('es-AR')}` : '-'}
            </p>
          </div>
        </div>
      </div>

      <div className="contenedor">
        <button className="btn-principal"
          onClick={() => { setMostrando(!mostrando); setEditando(null); setNombre(''); setMontoRef('') }}
          style={{ marginBottom: 12 }}>
          {mostrando && !editando ? 'Cancelar' : '+ Agregar gasto fijo'}
        </button>

        {mostrando && (
          <div style={{ background: 'var(--fondo-card)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <div className="campo">
              <label>Nombre del gasto</label>
              <input type="text" placeholder="Ej: Alquiler, Luz, Internet..." value={nombre}
                onChange={e => setNombre(e.target.value)} autoFocus />
            </div>
            <div className="campo">
              <label>Monto de referencia (opcional)</label>
              <input type="number" min="0" placeholder="Monto aproximado" value={montoRef}
                onChange={e => setMontoRef(e.target.value)} />
            </div>
            <button className="btn-principal" onClick={guardar} disabled={!nombre.trim() || guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar'}
            </button>
          </div>
        )}

        <p className="seccion-titulo">Items de la plantilla ({items.length})</p>

        {items.length === 0 && (
          <div className="vacio">Todavía no hay gastos fijos. Agregá los primeros.</div>
        )}

        {items.map(item => (
          <div key={item.id} style={{
            background: 'var(--fondo-card)', borderRadius: 12, padding: '12px 14px',
            marginBottom: 8, opacity: item.activo ? 1 : 0.5
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: 'var(--blanco)', fontSize: 15, fontWeight: 600, margin: '0 0 2px' }}>
                  {item.nombre}
                  {!item.activo && <span style={{ color: 'var(--gris)', fontSize: 11, marginLeft: 8 }}>inactivo</span>}
                </p>
                <p style={{ color: 'var(--gris)', fontSize: 12, margin: 0 }}>
                  {item.monto_referencia
                    ? `Referencia: $${Number(item.monto_referencia).toLocaleString('es-AR')}`
                    : 'Sin monto de referencia'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => iniciarEdicion(item)}
                style={{ background: 'none', border: 'none', color: 'var(--amarillo)', fontSize: 12, fontWeight: 600, padding: 0 }}>
                ✎ editar
              </button>
              <button onClick={() => toggleActivo(item)}
                style={{ background: 'none', border: 'none', color: 'var(--gris)', fontSize: 12, padding: 0 }}>
                {item.activo ? '⊘ desactivar' : '✓ activar'}
              </button>
              <button onClick={() => eliminar(item)}
                style={{ background: 'none', border: 'none', color: 'var(--rojo)', fontSize: 12, padding: 0 }}>
                🗑 eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
