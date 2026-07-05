export default function PantallaArchivo({ cajasArchivadas, onVolver, onVerDetalle }) {
  return (
    <div>
      <div className="top-bar">
        <button className="btn-volver" onClick={onVolver}>←</button>
        <h2>Cajas anteriores</h2>
      </div>

      <div className="contenedor">
        {cajasArchivadas.length === 0 && (
          <div className="vacio">Todavía no hay cajas archivadas.</div>
        )}

        {cajasArchivadas.map(c => (
          <div key={c.id} className="caja-archivada" onClick={() => onVerDetalle(c)} style={{ cursor: 'pointer' }}>
            <p className="nombre">{c.descripcion || 'Gastos del hogar'}</p>
            <p className="detalle">
              Inicio: {formatFecha(c.fecha_inicio)} ·
              Monto: ${Number(c.monto_inicial).toLocaleString('es-AR')} ·
              Saldo final: <span style={{ color: c.saldo > 0 ? 'var(--verde)' : 'var(--rojo)' }}>
                ${Number(c.saldo).toLocaleString('es-AR')}
              </span>
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatFecha(fecha) {
  if (!fecha) return ''
  const [y, m, d] = fecha.split('-')
  return `${d}/${m}/${y}`
}
