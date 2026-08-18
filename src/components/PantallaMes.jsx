import { useState } from 'react'

const MESES_NOMBRES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function PantallaMes({ mes, cajasActivas, gastosPorCaja, ingresosMes, onSeleccionar, onNuevaCaja, onVerBalance, onGastosFijos, onCajaFijaMes, onCerrarMes, onVerArchivo, onCerrarSesion, escala, onCambiarEscala }) {

  const cajasFijasA = cajasActivas.filter(c => c.tipo_caja === 'fija_a')
  const cajasFijasB = cajasActivas.filter(c => c.tipo_caja === 'fija_b')
  const cajasVariables = cajasActivas.filter(c => !c.tipo_caja || c.tipo_caja === 'variable')

  const totalIngresos = ingresosMes.reduce((acc, i) => acc + Number(i.monto_pesos), 0)

  const gastosPagadosDe = (cajas) => cajas.reduce((acc, caja) => {
    const gastos = (gastosPorCaja[caja.id] || []).filter(g => g.estado !== 'pendiente')
    return acc + gastos.reduce((s, g) => s + Number(g.monto), 0)
  }, 0)

  const gastosPendientesDe = (cajas) => cajas.reduce((acc, caja) => {
    const gastos = (gastosPorCaja[caja.id] || []).filter(g => g.estado === 'pendiente')
    return acc + gastos.reduce((s, g) => s + Number(g.monto), 0)
  }, 0)

  const totalPagadoFijoA = gastosPagadosDe(cajasFijasA)
  const totalPendienteFijoA = gastosPendientesDe(cajasFijasA)
  const totalPagadoFijoB = gastosPagadosDe(cajasFijasB)
  const totalPendienteFijoB = gastosPendientesDe(cajasFijasB)
  const totalVariables = cajasVariables.reduce((acc, c) => acc + (Number(c.monto_inicial) - Number(c.saldo)), 0)
  const saldoDisponible = cajasVariables.reduce((acc, c) => acc + Number(c.saldo), 0)
  const totalComprometido = totalPendienteFijoA + totalPendienteFijoB
  const totalGastado = totalPagadoFijoA + totalPagadoFijoB + totalVariables
  const balance = totalIngresos - totalGastado

  return (
    <div>
      <div className="header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p className="subt">Mes activo</p>
            <p className="titulo">{MESES_NOMBRES[mes.mes - 1]} {mes.año}</p>
          </div>
          <button onClick={onCerrarSesion} style={{ background: 'none', border: 'none', color: 'var(--gris)', fontSize: 12, padding: 0 }}>⎋ salir</button>
        </div>

        {/* Resumen financiero */}
        <div className="fila-stats" style={{ marginBottom: 8 }}>
          <div className="stat-card">
            <p className="label">Ingresos del mes</p>
            <p className="valor" style={{ color: 'var(--verde)', fontSize: 17 }}>
              ${Math.round(totalIngresos).toLocaleString('es-AR')}
            </p>
          </div>
          <div className="stat-card">
            <p className="label">Gastado</p>
            <p className="valor" style={{ color: 'var(--rojo)', fontSize: 17 }}>
              ${Math.round(totalGastado).toLocaleString('es-AR')}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1, background: 'var(--fondo)', borderRadius: 10, padding: '10px 12px' }}>
            <p style={{ color: 'var(--gris)', fontSize: 11, margin: '0 0 2px' }}>Disponible efectivo</p>
            <p style={{ color: 'var(--verde)', fontSize: 16, fontWeight: 700, margin: 0 }}>
              ${saldoDisponible.toLocaleString('es-AR')}
            </p>
          </div>
          <div style={{ flex: 1, background: 'var(--fondo)', borderRadius: 10, padding: '10px 12px' }}>
            <p style={{ color: 'var(--gris)', fontSize: 11, margin: '0 0 2px' }}>Comprometido fijos</p>
            <p style={{ color: 'var(--amarillo)', fontSize: 16, fontWeight: 700, margin: 0 }}>
              ${totalComprometido.toLocaleString('es-AR')}
            </p>
          </div>
        </div>

        <div style={{ background: 'var(--fondo)', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: 'var(--gris)', fontSize: 12, margin: 0 }}>Balance del mes</p>
          <p style={{ fontSize: 18, fontWeight: 700, margin: 0, color: balance >= 0 ? 'var(--verde)' : 'var(--rojo)' }}>
            {balance >= 0 ? '+' : ''}${Math.round(balance).toLocaleString('es-AR')}
          </p>
        </div>
      </div>

      <div className="contenedor">
        {/* Botones de acción */}
        <button className="btn-principal" onClick={onNuevaCaja} style={{ marginBottom: 8 }}>+ Nueva caja variable</button>

        <button onClick={() => onCajaFijaMes('a')} style={{
          width: '100%', background: 'var(--fondo-card)', color: 'var(--blanco)',
          border: '1px solid var(--borde)', borderRadius: 12, padding: 14,
          fontSize: 15, fontWeight: 600, marginBottom: 8
        }}>
          📋 Gastos Fijos Iniciales
        </button>

        <button onClick={onVerBalance} style={{ width: '100%', background: 'var(--fondo-card)', color: 'var(--amarillo)', border: '1px solid var(--amarillo)', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
          📊 Balance ingresos / gastos
        </button>

        {/* Cajas Fijas A */}
        {(cajasFijasA.length > 0 || cajasFijasB.length > 0) && (
          <SeccionCajas titulo="Gastos Fijos Iniciales" cajas={[...cajasFijasA, ...cajasFijasB]} gastosPorCaja={gastosPorCaja} color="var(--amarillo)" onSeleccionar={onSeleccionar} />
        )}

        {/* Cajas Variables */}
        {cajasVariables.length > 0 && <SeccionCajas titulo="Cajas variables" cajas={cajasVariables} gastosPorCaja={gastosPorCaja} color="var(--verde)" onSeleccionar={onSeleccionar} showSaldo />}

        {cajasActivas.length === 0 && <div className="vacio">No hay cajas este mes. Empezá cargando los gastos fijos o abriendo una caja.</div>}

        {/* Acciones del mes */}
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="btn-secundario" onClick={onVerBalance}>📊 Ver balance detallado</button>
          <button className="btn-secundario" onClick={onGastosFijos}>⚙️ Configurar gastos fijos</button>
          <button className="btn-secundario" onClick={onVerArchivo}>📁 Ver cajas cerradas</button>
          <button onClick={onCerrarMes} style={{ width: '100%', background: 'transparent', color: 'var(--rojo)', border: '1px solid var(--rojo)', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 600 }}>
            Cerrar {MESES_NOMBRES[mes.mes - 1]} y arrancar nuevo mes
          </button>
        </div>

        {/* Selector tamaño letra */}
        <div style={{ marginTop: 20, background: 'var(--fondo-card)', borderRadius: 12, padding: '14px 16px' }}>
          <p style={{ color: 'var(--gris)', fontSize: '0.75rem', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Tamaño de letra</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ valor: 'normal', size: '14px' }, { valor: 'grande', size: '18px' }, { valor: 'muy-grande', size: '22px' }].map(op => (
              <button key={op.valor} onClick={() => onCambiarEscala(op.valor)} style={{
                flex: 1, padding: '10px', borderRadius: 10,
                border: escala === op.valor ? '2px solid var(--amarillo)' : '1px solid var(--borde)',
                background: escala === op.valor ? 'var(--fondo)' : 'transparent',
                color: escala === op.valor ? 'var(--amarillo)' : 'var(--gris)',
                fontSize: op.size, fontWeight: 700,
              }}>A</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SeccionCajas({ titulo, cajas, gastosPorCaja, color, onSeleccionar, showSaldo }) {
  return (
    <>
      <p className="seccion-titulo">{titulo}</p>
      {cajas.map(caja => {
        const gastos = gastosPorCaja[caja.id] || []
        const pendientes = gastos.filter(g => g.estado === 'pendiente')
        const pagados = gastos.filter(g => g.estado !== 'pendiente')
        const totalPend = pendientes.reduce((acc, g) => acc + Number(g.monto), 0)
        const totalPag = pagados.reduce((acc, g) => acc + Number(g.monto), 0)
        return (
          <div key={caja.id} onClick={() => onSeleccionar(caja)}
            style={{ background: 'var(--fondo-card)', borderRadius: 14, padding: '14px 16px', marginBottom: 8, cursor: 'pointer', borderLeft: `3px solid ${color}` }}>
            <p style={{ color: 'var(--blanco)', fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>{caja.descripcion}</p>
            <div style={{ display: 'flex', gap: 12 }}>
              {showSaldo ? (
                <>
                  <div>
                    <p style={{ color: 'var(--gris)', fontSize: 11, margin: '0 0 2px' }}>Saldo</p>
                    <p style={{ color: 'var(--verde)', fontSize: 14, fontWeight: 600, margin: 0 }}>${Number(caja.saldo).toLocaleString('es-AR')}</p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--gris)', fontSize: 11, margin: '0 0 2px' }}>Gastado</p>
                    <p style={{ color: 'var(--rojo)', fontSize: 14, fontWeight: 600, margin: 0 }}>${(Number(caja.monto_inicial) - Number(caja.saldo)).toLocaleString('es-AR')}</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p style={{ color: 'var(--gris)', fontSize: 11, margin: '0 0 2px' }}>Pagado</p>
                    <p style={{ color: 'var(--verde)', fontSize: 14, fontWeight: 600, margin: 0 }}>${totalPag.toLocaleString('es-AR')}</p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--gris)', fontSize: 11, margin: '0 0 2px' }}>Pendiente</p>
                    <p style={{ color: color, fontSize: 14, fontWeight: 600, margin: 0 }}>${totalPend.toLocaleString('es-AR')}</p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--gris)', fontSize: 11, margin: '0 0 2px' }}>Items</p>
                    <p style={{ color: 'var(--gris)', fontSize: 14, fontWeight: 600, margin: 0 }}>{pagados.length}/{gastos.length}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )
      })}
    </>
  )
}
