import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function hoy() { return new Date().toISOString().split('T')[0] }
function primerDiaMes() {
  const h = new Date()
  return `${h.getFullYear()}-${String(h.getMonth()+1).padStart(2,'0')}-01`
}

const PERIODOS = [
  { label: 'Este mes', desde: primerDiaMes(), hasta: hoy() },
  { label: 'Últimos 2 meses', desde: offsetMes(-1), hasta: hoy() },
  { label: 'Últimos 3 meses', desde: offsetMes(-2), hasta: hoy() },
  { label: 'Últimos 6 meses', desde: offsetMes(-5), hasta: hoy() },
  { label: 'Este año', desde: `${new Date().getFullYear()}-01-01`, hasta: hoy() },
  { label: 'Personalizado', desde: '', hasta: '' },
]

function offsetMes(n) {
  const d = new Date()
  d.setMonth(d.getMonth() + n, 1)
  return d.toISOString().split('T')[0]
}

export default function PantallaBalance({ gastosPorCaja, cajas, persona, onVolver }) {
  const [periodoIdx, setPeriodoIdx] = useState(0)
  const [desde, setDesde] = useState(primerDiaMes())
  const [hasta, setHasta] = useState(hoy())
  const [ingresos, setIngresos] = useState([])
  const [vistaTab, setVistaTab] = useState('resumen') // 'resumen' | 'ingresos'
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarIngresos()
  }, [desde, hasta])

  async function cargarIngresos() {
    setCargando(true)
    const { data } = await supabase
      .from('ingresos')
      .select('*')
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .order('fecha', { ascending: false })
    if (data) setIngresos(data)
    setCargando(false)
  }

  function elegirPeriodo(idx) {
    setPeriodoIdx(idx)
    if (idx < PERIODOS.length - 1) {
      setDesde(PERIODOS[idx].desde)
      setHasta(PERIODOS[idx].hasta)
    }
  }

  // Gastos del período: solo los PAGADOS (no pendientes)
  const todosGastos = Object.values(gastosPorCaja).flat()
  const gastosPeriodo = todosGastos.filter(g => {
    const f = g.creado_en?.split('T')[0]
    return f >= desde && f <= hasta && g.estado !== 'pendiente'
  })
  const totalGastos = gastosPeriodo.reduce((acc, g) => acc + Number(g.monto), 0)

  const totalIngresosPesos = ingresos.reduce((acc, i) => acc + Number(i.monto_pesos), 0)
  const balance = totalIngresosPesos - totalGastos

  return (
    <div>
      <div style={{ padding: '12px 16px 0' }}>
        <button className="btn-volver" onClick={onVolver}>←</button>
      </div>
      <div className="header">
        <p className="subt">Balance de ingresos y gastos</p>
        <p className="titulo">Resumen financiero</p>

        {/* Selector de período */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {PERIODOS.map((p, i) => (
            <button key={i} onClick={() => elegirPeriodo(i)} style={{
              background: periodoIdx === i ? 'var(--amarillo)' : 'var(--fondo)',
              color: periodoIdx === i ? '#1a1a1a' : 'var(--gris)',
              border: 'none', borderRadius: 20, padding: '6px 12px',
              fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap'
            }}>{p.label}</button>
          ))}
        </div>

        {periodoIdx === PERIODOS.length - 1 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <div className="campo" style={{ flex: 1, marginBottom: 0 }}>
              <label>Desde</label>
              <input type="date" value={desde} onChange={e => setDesde(e.target.value)} />
            </div>
            <div className="campo" style={{ flex: 1, marginBottom: 0 }}>
              <label>Hasta</label>
              <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      <div className="contenedor">
        {/* Cards resumen */}
        <div className="fila-stats" style={{ marginBottom: 10 }}>
          <div className="stat-card">
            <p className="label">Ingresos</p>
            <p className="valor" style={{ color: 'var(--verde)', fontSize: 18 }}>
              ${Math.round(totalIngresosPesos).toLocaleString('es-AR')}
            </p>
          </div>
          <div className="stat-card">
            <p className="label">Gastos</p>
            <p className="valor" style={{ color: 'var(--rojo)', fontSize: 18 }}>
              ${Math.round(totalGastos).toLocaleString('es-AR')}
            </p>
          </div>
        </div>

        <div style={{ background: 'var(--fondo-card)', borderRadius: 14, padding: '16px', marginBottom: 16, textAlign: 'center' }}>
          <p style={{ color: 'var(--gris)', fontSize: 13, margin: '0 0 6px' }}>Balance del período</p>
          <p style={{ fontSize: 28, fontWeight: 700, margin: 0, color: balance >= 0 ? 'var(--verde)' : 'var(--rojo)' }}>
            {balance >= 0 ? '+' : ''}${Math.round(balance).toLocaleString('es-AR')}
          </p>
          <p style={{ color: 'var(--gris)', fontSize: 12, margin: '6px 0 0' }}>
            {balance >= 0 ? '✓ Los ingresos superan los gastos' : '⚠ Los gastos superan los ingresos'}
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['resumen', 'ingresos'].map(tab => (
            <button key={tab} onClick={() => setVistaTab(tab)} style={{
              flex: 1, padding: '10px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 600,
              background: vistaTab === tab ? 'var(--amarillo)' : 'var(--fondo-card)',
              color: vistaTab === tab ? '#1a1a1a' : 'var(--gris)'
            }}>
              {tab === 'resumen' ? '📊 Gastos' : '💰 Ingresos'}
            </button>
          ))}
        </div>

        {vistaTab === 'resumen' && (
          <>
            <p className="seccion-titulo">Gastos del período ({gastosPeriodo.length})</p>
            {gastosPeriodo.length === 0 && <div className="vacio">Sin gastos en este período.</div>}
            {gastosPeriodo.map(g => (
              <div key={g.id} className="gasto-fila">
                <div>
                  <p className="gasto-motivo">{g.motivo}</p>
                  <p className="gasto-meta">{g.persona} · {g.creado_en?.split('T')[0].split('-').reverse().join('/')}</p>
                </div>
                <p className="gasto-monto">-${Number(g.monto).toLocaleString('es-AR')}</p>
              </div>
            ))}
          </>
        )}

        {vistaTab === 'ingresos' && (
          <SeccionIngresos ingresos={ingresos} persona={persona} desde={desde} hasta={hasta} onActualizar={cargarIngresos} />
        )}
      </div>
    </div>
  )
}

function SeccionIngresos({ ingresos, persona, desde, hasta, onActualizar }) {
  const [mostrando, setMostrando] = useState(false)
  const [desc, setDesc] = useState('')
  const [monto, setMonto] = useState('')
  const [moneda, setMoneda] = useState('pesos')
  const [tipoCambio, setTipoCambio] = useState('')
  const [fecha, setFecha] = useState(hoy())
  const [guardando, setGuardando] = useState(false)

  const montoPesos = moneda === 'dolares' && tipoCambio && monto
    ? Number(monto) * Number(tipoCambio)
    : Number(monto)

  async function guardar() {
    if (!desc.trim() || !monto || Number(monto) <= 0) return
    if (moneda === 'dolares' && (!tipoCambio || Number(tipoCambio) <= 0)) return
    setGuardando(true)
    await supabase.from('ingresos').insert({
      descripcion: desc.trim(),
      monto: Number(monto),
      moneda,
      tipo_cambio: moneda === 'dolares' ? Number(tipoCambio) : 1,
      monto_pesos: montoPesos,
      persona,
      fecha,
    })
    setDesc(''); setMonto(''); setTipoCambio(''); setMoneda('pesos')
    setMostrando(false)
    setGuardando(false)
    onActualizar()
  }

  async function eliminar(id) {
    const ok = window.confirm('¿Eliminar este ingreso?')
    if (!ok) return
    await supabase.from('ingresos').delete().eq('id', id)
    onActualizar()
  }

  return (
    <>
      <button className="btn-principal" onClick={() => setMostrando(!mostrando)} style={{ marginBottom: 12 }}>
        {mostrando ? 'Cancelar' : '+ Cargar ingreso'}
      </button>

      {mostrando && (
        <div style={{ background: 'var(--fondo-card)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <div className="campo">
            <label>Descripción</label>
            <input type="text" placeholder="Ej: Honorarios, Alquiler..." value={desc} onChange={e => setDesc(e.target.value)} autoFocus />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="campo" style={{ flex: 1 }}>
              <label>Moneda</label>
              <select value={moneda} onChange={e => setMoneda(e.target.value)}>
                <option value="pesos">Pesos $</option>
                <option value="dolares">Dólares USD</option>
              </select>
            </div>
            <div className="campo" style={{ flex: 1 }}>
              <label>Monto</label>
              <input type="number" min="0" placeholder="0" value={monto} onChange={e => setMonto(e.target.value)} />
            </div>
          </div>
          {moneda === 'dolares' && (
            <div className="campo">
              <label>Tipo de cambio ($ por USD)</label>
              <input type="number" min="0" placeholder="Ej: 1200" value={tipoCambio} onChange={e => setTipoCambio(e.target.value)} />
              {montoPesos > 0 && (
                <p style={{ color: 'var(--verde)', fontSize: 13, margin: '6px 0 0' }}>
                  = ${Math.round(montoPesos).toLocaleString('es-AR')} pesos
                </p>
              )}
            </div>
          )}
          <div className="campo">
            <label>Fecha</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>
          <button className="btn-principal" onClick={guardar}
            disabled={!desc.trim() || !monto || (moneda === 'dolares' && !tipoCambio) || guardando}>
            {guardando ? 'Guardando...' : 'Confirmar ingreso'}
          </button>
        </div>
      )}

      <p className="seccion-titulo">Ingresos del período ({ingresos.length})</p>
      {ingresos.length === 0 && <div className="vacio">Sin ingresos registrados en este período.</div>}
      {ingresos.map(i => (
        <div key={i.id} className="gasto-fila" style={{ flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p className="gasto-motivo">{i.descripcion}</p>
              <p className="gasto-meta">
                {i.persona} · {i.fecha?.split('-').reverse().join('/')}
                {i.moneda === 'dolares' && ` · USD ${Number(i.monto).toLocaleString('es-AR')} @ $${Number(i.tipo_cambio).toLocaleString('es-AR')}`}
              </p>
            </div>
            <p style={{ color: 'var(--verde)', fontSize: 16, fontWeight: 500, margin: 0, whiteSpace: 'nowrap' }}>
              +${Math.round(Number(i.monto_pesos)).toLocaleString('es-AR')}
            </p>
          </div>
          <button onClick={() => eliminar(i.id)} style={{ background: 'none', border: 'none', color: 'var(--rojo)', fontSize: 12, textAlign: 'right', padding: '2px 0' }}>
            🗑 eliminar
          </button>
        </div>
      ))}
    </>
  )
}
