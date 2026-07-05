import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import PantallaBienvenida from './components/PantallaBienvenida'
import PantallaCaja from './components/PantallaCaja'
import PantallaCargarGasto from './components/PantallaCargarGasto'
import PantallaNewCaja from './components/PantallaNewCaja'
import PantallaArchivo from './components/PantallaArchivo'
import PantallaEditarCaja from './components/PantallaEditarCaja'

export default function App() {
  const [persona, setPersona] = useState(() => localStorage.getItem('gastos_persona') || '')
  const [vista, setVista] = useState('caja')
  const [cajaActiva, setCajaActiva] = useState(null)
  const [cajasArchivadas, setCajasArchivadas] = useState([])
  const [gastos, setGastos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!persona) return
    cargarDatos()
    const canal = supabase
      .channel('gastos-cambios')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cajas' }, cargarDatos)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gastos' }, cargarGastos)
      .subscribe()
    return () => supabase.removeChannel(canal)
  }, [persona])

  async function cargarDatos() {
    setCargando(true)
    const { data: cajas } = await supabase
      .from('cajas').select('*').order('creado_en', { ascending: false })
    if (cajas) {
      setCajaActiva(cajas.find(c => c.estado === 'activa') || null)
      setCajasArchivadas(cajas.filter(c => c.estado === 'archivada'))
    }
    await cargarGastos()
    setCargando(false)
  }

  async function cargarGastos() {
    const { data: cajas } = await supabase
      .from('cajas').select('id').eq('estado', 'activa').limit(1)
    if (!cajas || cajas.length === 0) { setGastos([]); return }
    const { data } = await supabase
      .from('gastos').select('*').eq('caja_id', cajas[0].id)
      .order('creado_en', { ascending: false })
    if (data) setGastos(data)
  }

  function cerrarSesion() {
    localStorage.removeItem('gastos_persona')
    setPersona('')
  }

  function confirmarPersona(nombre) {
    localStorage.setItem('gastos_persona', nombre)
    setPersona(nombre)
  }

  async function crearCaja({ descripcion, monto, fecha }) {
    await supabase.from('cajas').insert({
      descripcion, monto_inicial: monto, saldo: monto, fecha_inicio: fecha, estado: 'activa',
    })
    await cargarDatos()
    setVista('caja')
  }

  async function editarCaja(cajaId, cambios) {
    await supabase.from('cajas').update(cambios).eq('id', cajaId)
    await cargarDatos()
    setVista('caja')
  }

  async function cargarGasto({ motivo, monto, persona: quien }) {
    if (!cajaActiva) return
    await supabase.from('gastos').insert({ caja_id: cajaActiva.id, motivo, monto, persona: quien })
    const nuevoSaldo = Math.max(0, Number(cajaActiva.saldo) - monto)
    await supabase.from('cajas').update({ saldo: nuevoSaldo }).eq('id', cajaActiva.id)
    await cargarDatos()
    setVista('caja')
  }

  async function eliminarGasto(gasto) {
    const ok = window.confirm(`¿Eliminar el gasto "${gasto.motivo}" de $${Number(gasto.monto).toLocaleString('es-AR')}?`)
    if (!ok || !cajaActiva) return
    await supabase.from('gastos').delete().eq('id', gasto.id)
    const nuevoSaldo = Number(cajaActiva.saldo) + Number(gasto.monto)
    await supabase.from('cajas').update({ saldo: nuevoSaldo }).eq('id', cajaActiva.id)
    await cargarDatos()
  }

  async function cerrarCaja() {
    const ok = window.confirm('¿Cerrar esta caja y archivarla?')
    if (!ok || !cajaActiva) return
    await supabase.from('cajas').update({ estado: 'archivada' }).eq('id', cajaActiva.id)
    await cargarDatos()
    setVista('caja')
  }

  async function reabrirCaja(caja) {
    if (cajaActiva) {
      const ok = window.confirm('Ya hay una caja activa. ¿Cerrarla y reabrir esta?')
      if (!ok) return
      await supabase.from('cajas').update({ estado: 'archivada' }).eq('id', cajaActiva.id)
    }
    await supabase.from('cajas').update({ estado: 'activa' }).eq('id', caja.id)
    await cargarDatos()
    setVista('caja')
  }

  async function eliminarCaja(caja) {
    const ok = window.confirm(`¿Eliminar la caja "${caja.descripcion}"? Esto borra también todos sus gastos.`)
    if (!ok) return
    await supabase.from('cajas').delete().eq('id', caja.id)
    await cargarDatos()
  }

  if (!persona) return <PantallaBienvenida onConfirmar={confirmarPersona} />
  if (cargando) return <div style={{ color: '#aaa', padding: 40, textAlign: 'center' }}>Cargando...</div>

  if (vista === 'nuevo-gasto' && cajaActiva)
    return <PantallaCargarGasto saldoDisponible={Number(cajaActiva.saldo)} persona={persona}
      onVolver={() => setVista('caja')} onGuardar={cargarGasto} />

  if (vista === 'nueva-caja')
    return <PantallaNewCaja onVolver={() => setVista('caja')} onGuardar={crearCaja} />

  if (vista === 'editar-caja' && cajaActiva)
    return <PantallaEditarCaja caja={cajaActiva} onVolver={() => setVista('caja')} onGuardar={editarCaja} />

  if (vista === 'archivo')
    return <PantallaArchivo cajasArchivadas={cajasArchivadas}
      onVolver={() => setVista('caja')} onReabrir={reabrirCaja} onEliminarCaja={eliminarCaja} />

  if (!cajaActiva) {
    return (
      <div>
        <div className="header" style={{ borderRadius: '0 0 20px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p className="subt">Hola, {persona}</p>
              <p className="titulo">Viatico Vivir</p>
            </div>
            <button onClick={cerrarSesion} style={{ background: 'none', border: 'none', color: 'var(--gris)', fontSize: 12, padding: 0 }}>
              ⎋ salir
            </button>
          </div>
        </div>
        <div className="contenedor" style={{ paddingTop: 24 }}>
          <p style={{ color: 'var(--gris)', marginBottom: 16 }}>No hay una caja activa.</p>
          <button className="btn-principal" onClick={() => setVista('nueva-caja')}>+ Crear nueva caja</button>
          {cajasArchivadas.length > 0 && (
            <button className="btn-secundario" style={{ marginTop: 10 }} onClick={() => setVista('archivo')}>
              📁 Ver cajas anteriores
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <PantallaCaja
      caja={cajaActiva}
      gastos={gastos}
      onAgregarGasto={() => setVista('nuevo-gasto')}
      onCerrarCaja={cerrarCaja}
      onVerArchivo={() => setVista('archivo')}
      onEditarCaja={() => setVista('editar-caja')}
      onEliminarGasto={eliminarGasto}
      onCerrarSesion={cerrarSesion}
    />
  )
}
