import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'

const MESES_NOMBRES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function fmtFecha(valor) {
  if (!valor) return ''
  const soloFecha = String(valor).split('T')[0]
  const [y, m, d] = soloFecha.split('-')
  if (!y || !m || !d) return soloFecha
  return `${d}/${m}/${y}`
}

function fmtMonto(n) {
  return '$' + Math.round(Number(n) || 0).toLocaleString('es-AR')
}

// Genera y descarga el PDF de cierre de mes: resumen + detalle de ingresos y de gastos
// (separados por caja), usando la fecha real de pago de cada gasto.
export function generarPdfCierreMes({ mes, ingresos, cajas, gastosPorCaja }) {
  const doc = new jsPDF()
  const nombreMes = `${MESES_NOMBRES[mes.mes - 1]} ${mes.año}`

  const totalIngresos = ingresos.reduce((acc, i) => acc + Number(i.monto_pesos), 0)

  const cajasFijas = cajas.filter(c => c.tipo_caja === 'fija_a' || c.tipo_caja === 'fija_b')
  const cajasVariables = cajas.filter(c => !c.tipo_caja || c.tipo_caja === 'variable')
  const cajasOrdenadas = [...cajasFijas, ...cajasVariables]

  const pagadosDe = caja => (gastosPorCaja[caja.id] || [])
    .filter(g => g.estado !== 'pendiente')
    .slice()
    .sort((a, b) => new Date(a.pagado_en || a.creado_en) - new Date(b.pagado_en || b.creado_en))

  const pendientesDe = caja => (gastosPorCaja[caja.id] || []).filter(g => g.estado === 'pendiente')

  const totalEgresos = cajasOrdenadas.reduce((acc, c) => acc + pagadosDe(c).reduce((s, g) => s + Number(g.monto), 0), 0)
  const saldoMes = totalIngresos - totalEgresos

  // Encabezado
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Viatico Vivir', 14, 18)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(13)
  doc.text(`Cierre de mes - ${nombreMes}`, 14, 26)
  doc.setFontSize(9)
  doc.setTextColor(120)
  const ahora = new Date()
  doc.text(`Generado el ${ahora.toLocaleDateString('es-AR')} ${ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`, 14, 31)
  doc.setTextColor(0)

  // Resumen
  autoTable(doc, {
    startY: 37,
    theme: 'grid',
    head: [['Ingresos totales', 'Egresos totales', 'Saldo del mes']],
    body: [[fmtMonto(totalIngresos), fmtMonto(totalEgresos), fmtMonto(saldoMes)]],
    styles: { fontSize: 12, halign: 'center', fontStyle: 'bold', cellPadding: 5 },
    headStyles: { fillColor: [30, 30, 30], fontSize: 10 },
  })

  let y = doc.lastAutoTable.finalY + 10

  // Ingresos
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('Ingresos', 14, y)
  y += 3

  const ingresosOrdenados = [...ingresos].sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
  if (ingresosOrdenados.length > 0) {
    autoTable(doc, {
      startY: y + 3,
      head: [['Fecha', 'Motivo', 'Persona', 'Monto']],
      body: ingresosOrdenados.map(i => [
        fmtFecha(i.fecha),
        i.descripcion + (i.moneda === 'dolares' ? ` (USD ${Number(i.monto).toLocaleString('es-AR')} @ $${Number(i.tipo_cambio).toLocaleString('es-AR')})` : ''),
        i.persona || '',
        fmtMonto(i.monto_pesos),
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [40, 110, 60] },
      columnStyles: { 3: { halign: 'right' } },
    })
    y = doc.lastAutoTable.finalY + 10
  } else {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Sin ingresos registrados.', 14, y + 6)
    y += 14
  }

  // Gastos, separados por caja
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('Gastos', 14, y)
  y += 8

  const cajasConMovimiento = cajasOrdenadas.filter(c => pagadosDe(c).length > 0 || pendientesDe(c).length > 0)

  if (cajasConMovimiento.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Sin gastos registrados.', 14, y)
  }

  for (const caja of cajasConMovimiento) {
    const pagados = pagadosDe(caja)
    const pendientes = pendientesDe(caja)
    const totalCaja = pagados.reduce((s, g) => s + Number(g.monto), 0)

    if (y > 265) { doc.addPage(); y = 18 }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(`${caja.descripcion || 'Caja'} - ${fmtMonto(totalCaja)}`, 14, y)
    y += 3

    if (pagados.length > 0) {
      autoTable(doc, {
        startY: y + 3,
        head: [['Fecha', 'Motivo', 'Persona', 'Monto']],
        body: pagados.map(g => [
          fmtFecha(g.pagado_en || g.creado_en),
          g.motivo,
          g.persona || '',
          fmtMonto(g.monto),
        ]),
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [150, 110, 20] },
        columnStyles: { 3: { halign: 'right' } },
      })
      y = doc.lastAutoTable.finalY + 6
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text('Sin gastos pagados en esta caja.', 14, y + 6)
      y += 10
    }

    if (pendientes.length > 0) {
      if (y > 275) { doc.addPage(); y = 18 }
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(9)
      doc.setTextColor(160, 60, 20)
      const texto = `Pendientes sin pagar al cierre: ${pendientes.map(g => g.motivo).join(', ')}`
      const lineas = doc.splitTextToSize(texto, 180)
      doc.text(lineas, 14, y)
      y += lineas.length * 4 + 6
      doc.setTextColor(0)
      doc.setFont('helvetica', 'normal')
    }
  }

  const slugMes = `${MESES_NOMBRES[mes.mes - 1]}-${mes.año}`.toLowerCase()
  doc.save(`viatico-vivir-cierre-${slugMes}.pdf`)
}
