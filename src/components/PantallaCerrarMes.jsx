import { useState } from 'react'

const MESES_NOMBRES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function PantallaCerrarMes({ mes, saldoRestante, cajasConSaldo, ingresosMes, cajasDelMes, gastosPorCaja, onVolver, onConfirmar }) {
  const [trasladar, setTrasladar] = useState(true)
  const [cerrando, setCerrando] = useState(false)
  const [generandoPdf, setGenerandoPdf] = useState(false)

  const mesActual = MESES_NOMBRES[mes.mes - 1]
  const proximo = mes.mes === 12 ? 1 : mes.mes + 1
  const anioProximo = mes.mes === 12 ? mes.año + 1 : mes.año
  const mesProximo = MESES_NOMBRES[proximo - 1]

  async function confirmar() {
    setCerrando(true)
    await onConfirmar({ trasladar, saldoRestante })
    setCerrando(false)
  }

  async function descargarPdf() {
    setGenerandoPdf(true)
    try {
      const { generarPdfCierreMes } = await import('../pdfCierreMes')
      generarPdfCierreMes({ mes, ingresos: ingresosMes || [], cajas: cajasDelMes || [], gastosPorCaja: gastosPorCaja || {} })
    } finally {
      setGenerandoPdf(false)
    }
  }

  return (
    <div>
      <div style={{ padding: '12px 16px 0' }}>
        <button className="btn-volver" onClick={onVolver}>←</button>
      </div>
      <div className="header">
        <p className="subt">Cierre de mes</p>
        <p className="titulo">Cerrar {mesActual} {mes.año}</p>
      </div>

      <div className="contenedor">
        <div style={{ background: 'var(--fondo-card)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <p style={{ color: 'var(--gris)', fontSize: 13, margin: '0 0 4px' }}>Saldo disponible al cerrar</p>
          <p style={{ color: saldoRestante > 0 ? 'var(--verde)' : 'var(--gris)', fontSize: 24, fontWeight: 700, margin: 0 }}>
            ${saldoRestante.toLocaleString('es-AR')}
          </p>
          {cajasConSaldo.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {cajasConSaldo.map(c => (
                <p key={c.id} style={{ color: 'var(--gris)', fontSize: 12, margin: '2px 0' }}>
                  · {c.descripcion}: ${Number(c.saldo).toLocaleString('es-AR')}
                </p>
              ))}
            </div>
          )}
        </div>

        {saldoRestante > 0 && (
          <div style={{ background: 'var(--fondo-card)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <p style={{ color: 'var(--blanco)', fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>
              ¿Qué hacemos con el saldo?
            </p>
            <button onClick={() => setTrasladar(true)} style={{
              width: '100%', padding: 12, borderRadius: 10, marginBottom: 8, textAlign: 'left',
              border: trasladar ? '2px solid var(--amarillo)' : '1px solid var(--borde)',
              background: trasladar ? 'var(--fondo)' : 'transparent',
              color: trasladar ? 'var(--amarillo)' : 'var(--gris)', fontSize: 14, fontWeight: 600
            }}>
              ✓ Trasladarlo como primera caja de {mesProximo}
            </button>
            <button onClick={() => setTrasladar(false)} style={{
              width: '100%', padding: 12, borderRadius: 10, textAlign: 'left',
              border: !trasladar ? '2px solid var(--amarillo)' : '1px solid var(--borde)',
              background: !trasladar ? 'var(--fondo)' : 'transparent',
              color: !trasladar ? 'var(--amarillo)' : 'var(--gris)', fontSize: 14, fontWeight: 600
            }}>
              Dejarlo archivado (no trasladar)
            </button>
          </div>
        )}

        <button onClick={descargarPdf} disabled={generandoPdf} style={{
          width: '100%', background: 'var(--fondo-card)', color: 'var(--amarillo)',
          border: '1px solid var(--amarillo)', borderRadius: 12, padding: 14,
          fontSize: 15, fontWeight: 700, marginBottom: 16
        }}>
          {generandoPdf ? 'Generando PDF...' : '📄 Descargar PDF del mes'}
        </button>

        <div style={{ background: '#2a1a1a', borderRadius: 14, padding: 14, marginBottom: 20, border: '1px solid var(--rojo)' }}>
          <p style={{ color: 'var(--rojo)', fontSize: 13, margin: 0 }}>
            Al confirmar, todas las cajas de {mesActual} se archivarán y {mesProximo} {anioProximo} arrancará limpio.
          </p>
        </div>

        <button className="btn-principal" onClick={confirmar} disabled={cerrando}>
          {cerrando ? 'Cerrando mes...' : `Confirmar cierre de ${mesActual}`}
        </button>
      </div>
    </div>
  )
}
