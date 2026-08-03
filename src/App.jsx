import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import PantallaBienvenida from './components/PantallaBienvenida'
import PantallaMes from './components/PantallaMes'
import PantallaCaja from './components/PantallaCaja'
import PantallaCargarGasto from './components/PantallaCargarGasto'
import PantallaNewCaja from './components/PantallaNewCaja'
import PantallaArchivo from './components/PantallaArchivo'
import PantallaEditarCaja from './components/PantallaEditarCaja'
import PantallaEditarGasto from './components/PantallaEditarGasto'
import PantallaBalance from './components/PantallaBalance'
import PantallaGastosFijos from './components/PantallaGastosFijos'
import PantallaCajaFijaMes from './components/PantallaCajaFijaMes'
import PantallaCerrarMes from './components/PantallaCerrarMes'

export default function App() {
  const [persona, setPersona] = useState(() => localStorage.getItem('gastos_persona') || '')
  const [vista, setVista] = useState('mes')
  const [mesActivo, setMesActivo] = useState(null)
  const [mesesCerrados, setMesesCerrados] = useState([])
  const [cajasActivas, setCajasActivas] = useState([])
  const [cajasArchivadas, setCajasArchivadas] = useState([])
  const [cajaSeleccionada, setCajaSeleccionada] = useState(null)
  const [gastoEditando, setGastoEditando] = useState(null)
  const [gastosPorCaja, setGastosPorCaja] = useState({})
  const [ingresosMes, setIngresosMes] = useState([])
  const [gastosFijos, setGastosFijos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [grupoFijo, setGrupoFijo] = useState('a')
  const [escala, setEscala] = useState(() => localStorage.getItem('escala_letra') || 'normal')

  useEffect(() => {
    const root = document.getElementById('root')
    if (root) root.className = `escala-${escala}`
  }, [escala])

  function cambiarEscala(nueva) {
    localStorage.setItem('escala_letra', nueva)
    setEscala(nueva)
  }

  useEffect(() => {
    if (!persona) return
    cargarTodo()
    const canal = supabase.channel('cambios')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meses' }, cargarTodo)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cajas' }, cargarCajas)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gastos' }, cargarGastos)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ingresos' }, cargarIngresos)
      .subscribe()
    return () => supabase.removeChannel(canal)
  }, [persona])

  async function cargarTodo() {
    setCargando(true)
    await Promise.all([cargarMes(), cargarCajas(), cargarGastos(), cargarGastosFijos()])
    setCargando(false)
  }

  async function cargarMes() {
    const { data } = await supabase.from('meses').select('*').order('creado_en', { ascending: false })
    if (data) {
      setMesActivo(data.find(m => m.estado === 'activo') || null)
      setMesesCerrados(data.filter(m => m.estado === 'cerrado'))
    }
  }

  async function cargarCajas() {
    const { data } = await supabase.from('cajas').select('*').order('creado_en', { ascending: false })
    if (data) {
      setCajasActivas(data.filter(c => c.estado === 'activa'))
      setCajasArchivadas(data.filter(c => c.estado === 'archivada'))
    }
  }

  async function cargarGastos() {
    const { data } = await supabase.from('gastos').select('*').order('creado_en', { ascending: false })
    if (data) {
      const porCaja = {}
      data.forEach(g => {
        if (!porCaja[g.caja_id]) porCaja[g.caja_id] = []
        porCaja[g.caja_id].push(g)
      })
      setGastosPorCaja(porCaja)
    }
  }

  async function cargarIngresos(mesId) {
    const id = mesId || mesActivo?.id
    if (!id) { setIngresosMes([]); return }
    const { data } = await supabase.from('ingresos').select('*').eq('mes_id', id).order('fecha', { ascending: false })
    if (data) setIngresosMes(data)
  }

  async function cargarGastosFijos() {
    const { data } = await supabase.from('gastos_fijos').select('*').eq('activo', true).order('nombre', { ascending: true })
    if (data) setGastosFijos(data)
  }

  useEffect(() => {
    if (mesActivo) cargarIngresos(mesActivo.id)
  }, [mesActivo])

  function cerrarSesion() {
    localStorage.removeItem('gastos_persona')
    setPersona('')
  }

  function confirmarPersona(nombre) {
    localStorage.setItem('gastos_persona', nombre)
    setPersona(nombre)
  }

  async function crearMesNuevo(saldoTrasladado = 0) {
    const hoy = new Date()
    const { data } = await supabase.from('meses').insert({
      nombre: hoy.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }),
      año: hoy.getFullYear(),
      mes: hoy.getMonth() + 1,
      estado: 'activo',
      saldo_trasladado: saldoTrasladado,
    }).select().single()

    if (data && saldoTrasladado > 0) {
      await supabase.from('cajas').insert({
        descripcion: 'Saldo del mes anterior',
        monto_inicial: saldoTrasladado,
        saldo: saldoTrasladado,
        fecha_inicio: hoy.toISOString().split('T')[0],
        estado: 'activa',
        mes_id: data.id,
        tipo_caja: 'variable',
      })
    }
    await cargarTodo()
    setVista('mes')
  }

  async function cerrarMes({ trasladar, saldoRestante }) {
    if (!mesActivo) return

    // Archivar el mes
    await supabase.from('meses').update({ estado: 'cerrado' }).eq('id', mesActivo.id)

    // Archivar todas las cajas del mes
    const cajasMes = cajasActivas.filter(c => c.mes_id === mesActivo.id)
    for (const caja of cajasMes) {
      await supabase.from('cajas').update({ estado: 'archivada' }).eq('id', caja.id)
    }

    // Calcular saldo real a trasladar: solo cajas variables activas del mes con saldo > 0
    const cajasVariablesConSaldo = cajasMes.filter(c =>
      (c.tipo_caja === 'variable' || !c.tipo_caja) && Number(c.saldo) > 0
    )
    const saldoReal = cajasVariablesConSaldo.reduce((acc, c) => acc + Number(c.saldo), 0)

    await crearMesNuevo(trasladar && saldoReal > 0 ? saldoReal : 0)
  }

  async function crearCajaFijaMes({ items, total, fecha, grupo, nombreGrupo }) {
    if (!mesActivo) return
    const { data: caja } = await supabase.from('cajas').insert({
      descripcion: nombreGrupo,
      monto_inicial: total,
      saldo: total,
      fecha_inicio: fecha,
      estado: 'activa',
      mes_id: mesActivo.id,
      tipo_caja: `fija_${grupo}`,
    }).select().single()

    if (caja) {
      for (const item of items) {
        await supabase.from('gastos').insert({
          caja_id: caja.id,
          motivo: item.nombre,
          monto: item.monto || 0,
          persona: 'Sistema',
          estado: 'pendiente',
        })
      }
    }
    for (const item of items) {
      if (item.monto > 0) {
        await supabase.from('gastos_fijos').update({ monto_referencia: item.monto }).eq('id', item.id)
      }
    }
    await cargarCajas()
    await cargarGastos()
    await cargarGastosFijos()
    setVista('mes')
  }

  async function crearCaja({ descripcion, monto, fecha }) {
    if (!mesActivo) return
    await supabase.from('cajas').insert({
      descripcion, monto_inicial: monto, saldo: monto,
      fecha_inicio: fecha, estado: 'activa',
      mes_id: mesActivo.id, tipo_caja: 'variable',
    })
    await cargarCajas()
    setVista('mes')
  }

  async function editarCaja(cajaId, cambios) {
    await supabase.from('cajas').update(cambios).eq('id', cajaId)
    await cargarCajas()
    setVista('caja-detalle')
  }

  async function cargarGasto({ motivo, monto, persona: quien, cajaId }) {
    await supabase.from('gastos').insert({ caja_id: cajaId, motivo, monto, persona: quien, estado: 'pagado' })
    const caja = cajasActivas.find(c => c.id === cajaId)
    if (caja) {
      const nuevoSaldo = Math.max(0, Number(caja.saldo) - monto)
      await supabase.from('cajas').update({ saldo: nuevoSaldo }).eq('id', cajaId)
    }
    await cargarCajas()
    await cargarGastos()
    setVista('caja-detalle')
  }

  async function confirmarPago(gasto, montoConfirmado, personaQuePago) {
    await supabase.from('gastos').update({ estado: 'pagado', monto: montoConfirmado, persona: personaQuePago }).eq('id', gasto.id)
    const caja = cajasActivas.find(c => c.id === gasto.caja_id)
    if (caja) {
      const nuevoSaldo = Math.max(0, Number(caja.saldo) - montoConfirmado)
      await supabase.from('cajas').update({ saldo: nuevoSaldo }).eq('id', gasto.caja_id)
    }
    await cargarCajas()
    await cargarGastos()
  }

  async function guardarEdicionGasto(gasto, cambios) {
    await supabase.from('gastos').update({ motivo: cambios.motivo, monto: cambios.monto }).eq('id', gasto.id)
    const caja = cajasActivas.find(c => c.id === gasto.caja_id)
    if (caja && gasto.estado === 'pagado') {
      const diferencia = Number(cambios.monto) - Number(gasto.monto)
      const nuevoSaldo = Math.max(0, Number(caja.saldo) - diferencia)
      await supabase.from('cajas').update({ saldo: nuevoSaldo }).eq('id', gasto.caja_id)
    }
    await cargarCajas()
    await cargarGastos()
    setGastoEditando(null)
    setVista('caja-detalle')
  }

  async function eliminarGasto(gasto) {
    const ok = window.confirm(`¿Eliminar "${gasto.motivo}"?`)
    if (!ok) return
    await supabase.from('gastos').delete().eq('id', gasto.id)
    const caja = cajasActivas.find(c => c.id === gasto.caja_id)
    if (caja && gasto.estado === 'pagado') {
      const nuevoSaldo = Number(caja.saldo) + Number(gasto.monto)
      await supabase.from('cajas').update({ saldo: nuevoSaldo }).eq('id', gasto.caja_id)
    }
    await cargarCajas()
    await cargarGastos()
  }

  async function cerrarCaja(caja) {
    const ok = window.confirm(`¿Cerrar la caja "${caja.descripcion}"?`)
    if (!ok) return
    await supabase.from('cajas').update({ estado: 'archivada' }).eq('id', caja.id)
    await cargarCajas()
    setVista('mes')
  }

  async function reabrirCaja(caja) {
    await supabase.from('cajas').update({ estado: 'activa' }).eq('id', caja.id)
    await cargarCajas()
    setVista('mes')
  }

  async function eliminarCaja(caja) {
    const ok = window.confirm(`¿Eliminar "${caja.descripcion}" y todos sus gastos?`)
    if (!ok) return
    await supabase.from('cajas').delete().eq('id', caja.id)
    await cargarCajas()
    await cargarGastos()
  }

  if (!persona) return <PantallaBienvenida onConfirmar={confirmarPersona} />
  if (cargando) return <div style={{ color: '#aaa', padding: 40, textAlign: 'center', fontSize: 16 }}>Cargando...</div>

  // Sin mes activo → crear nuevo mes
  if (!mesActivo) {
    return (
      <div>
        <div className="header" style={{ borderRadius: '0 0 20px 20px' }}>
          <p className="subt">Hola, {persona}</p>
          <p className="titulo">Viatico Vivir</p>
        </div>
        <div className="contenedor" style={{ paddingTop: 24 }}>
          <p style={{ color: 'var(--gris)', marginBottom: 16 }}>No hay un mes activo. Arrancá el nuevo mes.</p>
          <button className="btn-principal" onClick={() => crearMesNuevo(0)}>+ Arrancar nuevo mes</button>
          {mesesCerrados.length > 0 && (
            <button className="btn-secundario" style={{ marginTop: 10 }} onClick={() => setVista('archivo')}>
              📁 Ver meses anteriores
            </button>
          )}
        </div>
      </div>
    )
  }

  const cajasMesActivo = cajasActivas.filter(c => c.mes_id === mesActivo.id)
  const cajasConSaldo = cajasMesActivo.filter(c =>
    (c.tipo_caja === 'variable' || !c.tipo_caja) && Number(c.saldo) > 0
  )
  const saldoRestante = cajasConSaldo.reduce((acc, c) => acc + Number(c.saldo), 0)

  if (vista === 'cerrar-mes')
    return <PantallaCerrarMes mes={mesActivo} saldoRestante={saldoRestante} cajasConSaldo={cajasConSaldo}
      onVolver={() => setVista('mes')} onConfirmar={cerrarMes} />

  if (vista === 'caja-fija-mes')
    return <PantallaCajaFijaMes gastosFijos={gastosFijos} grupo={grupoFijo}
      onVolver={() => setVista('mes')} onCrear={crearCajaFijaMes} />

  if (vista === 'nueva-caja')
    return <PantallaNewCaja onVolver={() => setVista('mes')} onGuardar={crearCaja} />

  if (vista === 'gastos-fijos')
    return <PantallaGastosFijos onVolver={() => setVista('mes')} />

  if (vista === 'balance')
    return <PantallaBalance gastosPorCaja={gastosPorCaja} cajas={[...cajasActivas, ...cajasArchivadas]}
      persona={persona} mesActivo={mesActivo} ingresosMesActivo={ingresosMes}
      meses={[...(mesActivo ? [mesActivo] : []), ...mesesCerrados]}
      onVolver={() => setVista('mes')} />

  if (vista === 'archivo')
    return <PantallaArchivo cajasArchivadas={cajasArchivadas} mesesCerrados={mesesCerrados}
      onVolver={() => setVista('mes')} onReabrir={reabrirCaja} onEliminarCaja={eliminarCaja} />

  if (vista === 'caja-detalle' && cajaSeleccionada) {
    const cajaActual = cajasActivas.find(c => c.id === cajaSeleccionada.id) || cajaSeleccionada
    return <PantallaCaja caja={cajaActual} gastos={gastosPorCaja[cajaActual.id] || []} persona={persona}
      onVolver={() => setVista('mes')} onInicio={() => setVista('mes')}
      onAgregarGasto={() => setVista('nuevo-gasto')}
      onCerrarCaja={() => cerrarCaja(cajaActual)}
      onEditarCaja={() => setVista('editar-caja')}
      onEliminarGasto={eliminarGasto}
      onEditarGasto={g => { setGastoEditando(g); setVista('editar-gasto') }}
      onConfirmarPago={confirmarPago}
      onCerrarSesion={cerrarSesion}
    />
  }

  if (vista === 'nuevo-gasto' && cajaSeleccionada) {
    const cajaActual = cajasActivas.find(c => c.id === cajaSeleccionada.id) || cajaSeleccionada
    return <PantallaCargarGasto saldoDisponible={Number(cajaActual.saldo)} cajaId={cajaActual.id}
      persona={persona} onVolver={() => setVista('caja-detalle')} onGuardar={cargarGasto} />
  }

  if (vista === 'editar-gasto' && gastoEditando && cajaSeleccionada) {
    const cajaActual = cajasActivas.find(c => c.id === cajaSeleccionada.id) || cajaSeleccionada
    return <PantallaEditarGasto gasto={gastoEditando} saldoDisponible={Number(cajaActual.saldo)}
      onVolver={() => { setGastoEditando(null); setVista('caja-detalle') }} onGuardar={guardarEdicionGasto} />
  }

  if (vista === 'editar-caja' && cajaSeleccionada) {
    const cajaActual = cajasActivas.find(c => c.id === cajaSeleccionada.id) || cajaSeleccionada
    return <PantallaEditarCaja caja={cajaActual} onVolver={() => setVista('caja-detalle')} onGuardar={editarCaja} />
  }

  return <PantallaMes
    mes={mesActivo}
    cajasActivas={cajasMesActivo}
    gastosPorCaja={gastosPorCaja}
    ingresosMes={ingresosMes}
    persona={persona}
    onSeleccionar={caja => { setCajaSeleccionada(caja); setVista('caja-detalle') }}
    onNuevaCaja={() => setVista('nueva-caja')}
    onVerBalance={() => setVista('balance')}
    onGastosFijos={() => setVista('gastos-fijos')}
    onCajaFijaMes={grupo => { setGrupoFijo(grupo); setVista('caja-fija-mes') }}
    onCerrarMes={() => setVista('cerrar-mes')}
    onCerrarSesion={cerrarSesion}
    escala={escala}
    onCambiarEscala={cambiarEscala}
  />
}
