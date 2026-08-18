import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const MESES_NOMBRES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function hoy() { return new Date().toISOString().split('T')[0] }
function primerDiaMes(año, mes) { return `${año}-${String(mes).padStart(2,'0')}-01` }
function ultimoDiaMes(año, mes) {
  const d = new Date(año, mes, 0)
  return d.toISOString().split('T')[0]
}

export default function PantallaBalance({ gastosPorCaja, cajas, persona, mesActivo, ingresosMesActivo, onVolver, meses }) {
  const [modo, setModo] = useState('mes') // 'mes' | 'periodo'
  const [mesSeleccionado, setMesSeleccionado] = useState(mesActivo?.id || '')
  const [desde, setDesde] = useState(mesActivo ? primerDiaMes(mesActivo.año, mesActivo.mes) : primerDiaMes(new Date().getFullYear(), new Date().getMonth() + 1))
  const [hasta, setHasta] = useState(hoy())
  const [ingresos, setIngresos] = useState([])
  const [tab, setTab] = useState('resumen')
  const [cargando, setCargando] = useState(false)

  const todosMeses = meses || []

  useEffect(() => {
    if (modo === 'mes' && mesSeleccionado) {
      cargarIngresosPorMes(mesSeleccionado)
    } else if (modo === 'periodo') {
      cargarIngresosPorFecha()
    }
  }, [modo, mesSeleccionado, desde, hasta])

  async function cargarIngresosPorMes(mesId) {
    setCargando(true)
    const { data } = await supabase.from('ingresos').select('*').eq('mes_id', mesId).order('fecha', { ascending: false })
    if (data) setIngresos(data)
    setCargando(false)
  }

  async function cargarIngresosPorFecha() {
    setCargando(true)
    const { data } = await supabase.from('ingresos').select('*').gte('fecha', desde).lte('fecha', hasta).order('fecha', { ascending: false })
    if (data) setIngresos(data)
    setCargando(false)
  }

  // Calcular gastos según modo - incluye cajas activas Y archivadas
  const todasLasCajas = [...cajas]
  const todosGastos = Object.values(gastosPorCaja).flat().filter(g => g.estado !== 'pendiente')

  let gastosFiltrados = []
  if (modo === 'mes' && mesSeleccionado) {
    const cajasDelMes = todasLasCajas.filter(c => c.mes_id === mesSeleccionado)
    const idsCajas = cajasDelMes.map(c => c.id)
    gastosFiltrados = todosGastos.filter(g => idsCajas.includes(g.caja_id))
  } else if (modo === 'periodo') {
    gastosFiltrados = todosGastos.filter(g => {
      const f = (g.pagado_en || g.creado_en)?.split('T')[0]
      return f >= desde && f <= hasta
    })
  }

  const totalIngresos = ingresos.reduce((acc, i) => acc + Number(i.monto_pesos), 0)
  const totalGastos = gastosFiltrados.reduce((acc, g) => acc + Number(g.monto), 0)
  const balance = totalIngresos - totalGastos

  // Título del período seleccionado
  const mesObj = todosMeses.find(m => m.id === mesSeleccionado)
  const tituloPeriodo = modo === 'mes' && mesObj
    ? `${MESES_NOMBRES[mesObj.mes - 1]} ${mesObj.año}`
    : modo === 'periodo' ? `${desde.split('-').reverse().join('/')} al ${hasta.split('-').reverse().join('/')}` : ''

  return (
    <div>
      <div style={{ padding: '12px 16px 0' }}>
        <button className="btn-volver" onClick={onVolver}>←</button>
      </div>
      <div className="header">
        <p className="subt">Balance financiero</p>
        <p className="titulo">{tituloPeriodo || 'Seleccioná un período'}</p>

        {/* Selector de modo */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button onClick={() => setModo('mes')} style={{
            flex: 1, padding: '8px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600,
            background: modo === 'mes' ? 'var(--amarillo)' : 'var(--fondo)',
            color: modo === 'mes' ? '#1a1a1a' : 'var(--gris)'
          }}>Por mes</button>
          <button onClick={() => setModo('periodo')} style={{
            flex: 1, padding: '8px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600,
            background: modo === 'periodo' ? 'var(--amarillo)' : 'var(--fondo)',
            color: modo === 'periodo' ? '#1a1a1a' : 'var(--gris)'
          }}>Por período</button>
        </div>

        {/* Selector por mes */}
        {modo === 'mes' && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {todosMeses.map(m => (
              <button key={m.id} onClick={() => setMesSeleccionado(m.id)} style={{
                background: mesSeleccionado === m.id ? 'var(--amarillo)' : 'var(--fondo)',
                color: mesSeleccionado === m.id ? '#1a1a1a' : 'var(--gris)',
                border: 'none', borderRadius: 20, padding: '6px 14px',
                fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap'
              }}>
                {MESES_NOMBRES[m.mes - 1]} {m.año}
                {m.estado === 'activo' && ' ●'}
              </button>
            ))}
            {todosMeses.length === 0 && <p style={{ color: 'var(--gris)', fontSize: 13 }}>No hay meses registrados aún.</p>}
          </div>
        )}

        {/* Selector por período */}
        {modo === 'periodo' && (
          <div style={{ display: 'flex', gap: 8 }}>
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
              ${Math.round(totalIngresos).toLocaleString('es-AR')}
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
          {['resumen', 'ingresos'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '10px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 600,
              background: tab === t ? 'var(--amarillo)' : 'var(--fondo-card)',
              color: tab === t ? '#1a1a1a' : 'var(--gris)'
            }}>
              {t === 'resumen' ? '📊 Gastos' : '💰 Ingresos'}
            </button>
          ))}
        </div>

        {tab === 'resumen' && (
          <>
            <p className="seccion-titulo">Gastos pagados ({gastosFiltrados.length})</p>
            {gastosFiltrados.length === 0 && <div className="vacio">Sin gastos en este período.</div>}
            {gastosFiltrados.map(g => (
              <div key={g.id} className="gasto-fila">
                <div>
                  <p className="gasto-motivo">{g.motivo}</p>
                  <p className="gasto-meta">{g.persona} · {(g.pagado_en || g.creado_en)?.split('T')[0].split('-').reverse().join('/')}</p>
                </div>
                <p className="gasto-monto">-${Number(g.monto).toLocaleString('es-AR')}</p>
              </div>
            ))}
          </>
        )}

        {tab === 'ingresos' && (
          <SeccionIngresos ingresos={ingresos} persona={persona} mesId={modo === 'mes' ? mesSeleccionado : null} desde={desde} hasta={hasta} onActualizar={() => modo === 'mes' ? cargarIngresosPorMes(mesSeleccionado) : cargarIngresosPorFecha()} />
        )}
      </div>
    </div>
  )
}

function SeccionIngresos({ ingresos, persona, mesId, desde, hasta, onActualizar }) {
  const [mostrando, setMostrando] = useState(false)
  const [desc, setDesc] = useState('')
  const [monto, setMonto] = useState('')
  const [moneda, setMoneda] = useState('pesos')
  const [tipoCambio, setTipoCambio] = useState('')
  const [fecha, setFecha] = useState(hoy())
  const [guardando, setGuardando] = useState(false)

  const montoPesos = moneda === 'dolares' && tipoCambio && monto ? Number(monto) * Number(tipoCambio) : Number(monto)

  async function guardar() {
    if (!desc.trim() || !monto || Number(monto) <= 0) return
    if (moneda === 'dolares' && (!tipoCambio || Number(tipoCambio) <= 0)) return
    setGuardando(true)
    await supabase.from('ingresos').insert({
      descripcion: desc.trim(), monto: Number(monto), moneda,
      tipo_cambio: moneda === 'dolares' ? Number(tipoCambio) : 1,
      monto_pesos: montoPesos, persona, fecha,
      ...(mesId ? { mes_id: mesId } : {}),
    })
    setDesc(''); setMonto(''); setTipoCambio(''); setMoneda('pesos')
    setMostrando(false); setGuardando(false)
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
              {montoPesos > 0 && <p style={{ color: 'var(--verde)', fontSize: 13, margin: '6px 0 0' }}>= ${Math.round(montoPesos).toLocaleString('es-AR')} pesos</p>}
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
