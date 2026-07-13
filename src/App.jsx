import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import PantallaBienvenida from './components/PantallaBienvenida'
import PantallaCajas from './components/PantallaCajas'
import PantallaCaja from './components/PantallaCaja'
import PantallaCargarGasto from './components/PantallaCargarGasto'
import PantallaNewCaja from './components/PantallaNewCaja'
import PantallaArchivo from './components/PantallaArchivo'
import PantallaEditarCaja from './components/PantallaEditarCaja'
import PantallaEditarGasto from './components/PantallaEditarGasto'
import PantallaBalance from './components/PantallaBalance'
import PantallaGastosFijos from './components/PantallaGastosFijos'
import PantallaCajaFijaMes from './components/PantallaCajaFijaMes'

export default function App() {
  const [persona, setPersona] = useState(() => localStorage.getItem('gastos_persona') || '')
  const [vista, setVista] = useState('cajas')
  const [cajasActivas, setCajasActivas] = useState([])
  const [cajasArchivadas, setCajasArchivadas] = useState([])
  const [cajaSeleccionada, setCajaSeleccionada] = useState(null)
  const [gastoEditando, setGastoEditando] = useState(null)
  const [gastosPorCaja, setGastosPorCaja] = useState({})
  const [gastosFijos, setGastosFijos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!persona) return
    cargarDatos()
    cargarGastosFijos()
    const canal = supabase
      .channel('gastos-cambios')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cajas' }, cargarDatos)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gastos' }, cargarTodosGastos)
      .subscribe()
    return () => supabase.removeChannel(canal)
  }, [persona])

  async function cargarDatos() {
    setCargando(true)
    const { data: cajas } = await supabase
      .from('cajas').select('*').order('creado_en', { ascending: false })
    if (cajas) {
      setCajasActivas(cajas.filter(c => c.estado === 'activa'))
      setCajasArchivadas(cajas.filter(c => c.estado === 'archivada'))
    }
    await cargarTodosGastos()
    setCargando(false)
  }

  async function cargarTodosGastos() {
    const { data } = await supabase
      .from('gastos').select('*').order('creado_en', { ascending: false })
    if (data) {
      const porCaja = {}
      data.forEach(g => {
        if (!porCaja[g.caja_id]) porCaja[g.caja_id] = []
        porCaja[g.caja_id].push(g)
      })
      setGastosPorCaja(porCaja)
    }
  }

  async function cargarGastosFijos() {
    const { data } = await supabase
      .from('gastos_fijos').select('*').eq('activo', true).order('nombre', { ascending: true })
    if (data) setGastosFijos(data)
  }

  async function crearCajaFijaMes({ items, total, fecha, montosIds }) {
    const mes = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    const { data: caja } = await supabase.from('cajas').insert({
      descripcion: `Gastos fijos — ${mes}`,
      monto_inicial: total,
      saldo: 0,
      fecha_inicio: fecha,
      estado: 'activa',
    }).select().single()

    if (caja) {
      for (const item of items) {
        await supabase.from('gastos').insert({
          caja_id: caja.id,
          motivo: item.nombre,
          monto: item.monto,
          persona: 'Sistema',
        })
      }
    }

    // Actualizar monto de referencia en la plantilla con los valores de este mes
    for (const { id, monto } of montosIds) {
      if (monto > 0) {
        await supabase.from('gastos_fijos').update({ monto_referencia: monto }).eq('id', id)
      }
    }

    await cargarDatos()
    await cargarGastosFijos()
    setVista('cajas')
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
    setVista('cajas')
  }

  async function editarCaja(cajaId, cambios) {
    await supabase.from('cajas').update(cambios).eq('id', cajaId)
    await cargarDatos()
    setVista('caja-detalle')
  }

  async function cargarGasto({ motivo, monto, persona: quien, cajaId }) {
    await supabase.from('gastos').insert({ caja_id: cajaId, motivo, monto, persona: quien })
    const caja = cajasActivas.find(c => c.id === cajaId)
    if (caja) {
      const nuevoSaldo = Math.max(0, Number(caja.saldo) - monto)
      await supabase.from('cajas').update({ saldo: nuevoSaldo }).eq('id', cajaId)
    }
    await cargarDatos()
    setVista('caja-detalle')
  }

  async function guardarEdicionGasto(gasto, cambios) {
    await supabase.from('gastos').update({ motivo: cambios.motivo, monto: cambios.monto }).eq('id', gasto.id)
    const caja = cajasActivas.find(c => c.id === gasto.caja_id)
    if (caja) {
      const diferencia = Number(cambios.monto) - Number(gasto.monto)
      const nuevoSaldo = Math.max(0, Number(caja.saldo) - diferencia)
      await supabase.from('cajas').update({ saldo: nuevoSaldo }).eq('id', gasto.caja_id)
    }
    await cargarDatos()
    setGastoEditando(null)
    setVista('caja-detalle')
  }

  async function eliminarGasto(gasto) {
    const ok = window.confirm(`¿Eliminar el gasto "${gasto.motivo}" de $${Number(gasto.monto).toLocaleString('es-AR')}?`)
    if (!ok) return
    await supabase.from('gastos').delete().eq('id', gasto.id)
    const caja = cajasActivas.find(c => c.id === gasto.caja_id)
    if (caja) {
      const nuevoSaldo = Number(caja.saldo) + Number(gasto.monto)
      await supabase.from('cajas').update({ saldo: nuevoSaldo }).eq('id', gasto.caja_id)
    }
    await cargarDatos()
  }

  async function cerrarCaja(caja) {
    const ok = window.confirm(`¿Cerrar la caja "${caja.descripcion}" y archivarla?`)
    if (!ok) return
    await supabase.from('cajas').update({ estado: 'archivada' }).eq('id', caja.id)
    await cargarDatos()
    setVista('cajas')
  }

  async function reabrirCaja(caja) {
    await supabase.from('cajas').update({ estado: 'activa' }).eq('id', caja.id)
    await cargarDatos()
    setVista('cajas')
  }

  async function eliminarCaja(caja) {
    const ok = window.confirm(`¿Eliminar la caja "${caja.descripcion}"? Esto borra también todos sus gastos.`)
    if (!ok) return
    await supabase.from('cajas').delete().eq('id', caja.id)
    await cargarDatos()
  }

  if (!persona) return <PantallaBienvenida onConfirmar={confirmarPersona} />
  if (cargando) return <div style={{ color: '#aaa', padding: 40, textAlign: 'center' }}>Cargando...</div>

  if (vista === 'gastos-fijos')
    return <PantallaGastosFijos onVolver={() => setVista('cajas')} />

  if (vista === 'caja-fija-mes')
    return <PantallaCajaFijaMes
      gastosFijos={gastosFijos}
      onVolver={() => setVista('cajas')}
      onCrear={crearCajaFijaMes}
    />

  if (vista === 'balance')
    return <PantallaBalance
      gastosPorCaja={gastosPorCaja}
      cajas={[...cajasActivas, ...cajasArchivadas]}
      persona={persona}
      onVolver={() => setVista('cajas')}
    />

  if (vista === 'nueva-caja')
    return <PantallaNewCaja onVolver={() => setVista('cajas')} onGuardar={crearCaja} />

  if (vista === 'archivo')
    return <PantallaArchivo cajasArchivadas={cajasArchivadas}
      onVolver={() => setVista('cajas')} onReabrir={reabrirCaja} onEliminarCaja={eliminarCaja} />

  if (vista === 'caja-detalle' && cajaSeleccionada) {
    const cajaActual = cajasActivas.find(c => c.id === cajaSeleccionada.id) || cajaSeleccionada
    return <PantallaCaja
      caja={cajaActual}
      gastos={gastosPorCaja[cajaActual.id] || []}
      onVolver={() => setVista('cajas')}
      onAgregarGasto={() => setVista('nuevo-gasto')}
      onCerrarCaja={() => cerrarCaja(cajaActual)}
      onEditarCaja={() => setVista('editar-caja')}
      onEliminarGasto={eliminarGasto}
      onEditarGasto={g => { setGastoEditando(g); setVista('editar-gasto') }}
      onCerrarSesion={cerrarSesion}
    />
  }

  if (vista === 'nuevo-gasto' && cajaSeleccionada) {
    const cajaActual = cajasActivas.find(c => c.id === cajaSeleccionada.id) || cajaSeleccionada
    return <PantallaCargarGasto
      saldoDisponible={Number(cajaActual.saldo)}
      cajaId={cajaActual.id}
      persona={persona}
      onVolver={() => setVista('caja-detalle')}
      onGuardar={cargarGasto}
    />
  }

  if (vista === 'editar-gasto' && gastoEditando && cajaSeleccionada) {
    const cajaActual = cajasActivas.find(c => c.id === cajaSeleccionada.id) || cajaSeleccionada
    return <PantallaEditarGasto
      gasto={gastoEditando}
      saldoDisponible={Number(cajaActual.saldo)}
      onVolver={() => { setGastoEditando(null); setVista('caja-detalle') }}
      onGuardar={guardarEdicionGasto}
    />
  }

  if (vista === 'editar-caja' && cajaSeleccionada) {
    const cajaActual = cajasActivas.find(c => c.id === cajaSeleccionada.id) || cajaSeleccionada
    return <PantallaEditarCaja caja={cajaActual}
      onVolver={() => setVista('caja-detalle')} onGuardar={editarCaja} />
  }

  return <PantallaCajas
    cajasActivas={cajasActivas}
    gastosPorCaja={gastosPorCaja}
    persona={persona}
    onSeleccionar={caja => { setCajaSeleccionada(caja); setVista('caja-detalle') }}
    onNuevaCaja={() => setVista('nueva-caja')}
    onVerArchivo={() => setVista('archivo')}
    onCerrarSesion={cerrarSesion}
    onVerBalance={() => setVista('balance')}
    onGastosFijos={() => setVista('gastos-fijos')}
    onCajaFijaMes={() => setVista('caja-fija-mes')}
  />
}
