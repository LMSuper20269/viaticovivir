import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import PantallaBienvenida from './components/PantallaBienvenida'
import PantallaCaja from './components/PantallaCaja'
import PantallaCargarGasto from './components/PantallaCargarGasto'
import PantallaNewCaja from './components/PantallaNewCaja'
import PantallaArchivo from './components/PantallaArchivo'

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
      .from('cajas')
      .select('*')
      .order('creado_en', { ascending: false })

    if (cajas) {
      setCajaActiva(cajas.find(c => c.estado === 'activa') || null)
      setCajasArchivadas(cajas.filter(c => c.estado === 'archivada'))
    }
    await cargarGastos()
    setCargando(false)
  }

  async function cargarGastos() {
    const { data: cajas } = await supabase
      .from('cajas')
      .select('id')
      .eq('estado', 'activa')
      .limit(1)

    if (!cajas || cajas.length === 0) { setGastos([]); return }

    const { data } = await supabase
      .from('gastos')
      .select('*')
      .eq('caja_id', cajas[0].id)
      .order('creado_en', { ascending: false })

    if (data) setGastos(data)
  }

  function confirmarPersona(nombre) {
    localStorage.setItem('gastos_persona', nombre)
    setPersona(nombre)
  }

  async function crearCaja({ descripcion, monto, fecha }) {
    await supabase.from('cajas').insert({
      descripcion,
      monto_inicial: monto,
      saldo: monto,
      fecha_inicio: fecha,
      estado: 'activa',
    })
    await cargarDatos()
    setVista('caja')
  }

  async function cargarGasto({ motivo, monto, persona: quien }) {
    if (!cajaActiva) return

    await supabase.from('gastos').insert({
      caja_id: cajaActiva.id,
      motivo,
      monto,
      persona: quien,
    })

    const nuevoSaldo = Math.max(0, Number(cajaActiva.saldo) - monto)
    await supabase.from('cajas').update({ saldo: nuevoSaldo }).eq('id', cajaActiva.id)

    await cargarDatos()
    setVista('caja')
  }

  async function cerrarCaja() {
    const confirmado = window.confirm('¿Cerrar esta caja y archivarla? No se podrán cargar más gastos en ella.')
    if (!confirmado || !cajaActiva) return
    await supabase.from('cajas').update({ estado: 'archivada' }).eq('id', cajaActiva.id)
    await cargarDatos()
    setVista('caja')
  }

  if (!persona) return <PantallaBienvenida onConfirmar={confirmarPersona} />
  if (cargando) return <div style={{ color: '#aaa', padding: 40, textAlign: 'center' }}>Cargando...</div>

  if (vista === 'nuevo-gasto' && cajaActiva) {
    return <PantallaCargarGasto
      saldoDisponible={Number(cajaActiva.saldo)}
      persona={persona}
      onVolver={() => setVista('caja')}
      onGuardar={cargarGasto}
    />
  }

  if (vista === 'nueva-caja') {
    return <PantallaNewCaja
      onVolver={() => setVista('caja')}
      onGuardar={crearCaja}
    />
  }

  if (vista === 'archivo') {
    return <PantallaArchivo
      cajasArchivadas={cajasArchivadas}
      onVolver={() => setVista('caja')}
      onVerDetalle={() => {}}
    />
  }

  if (!cajaActiva) {
    return (
      <div>
        <div className="header" style={{ borderRadius: '0 0 20px 20px' }}>
          <p className="subt">Hola, {persona}</p>
          <p className="titulo">No hay una caja activa</p>
        </div>
        <div className="contenedor" style={{ paddingTop: 24 }}>
          <button className="btn-principal" onClick={() => setVista('nueva-caja')}>
            + Crear nueva caja
          </button>
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
    />
  )
}
