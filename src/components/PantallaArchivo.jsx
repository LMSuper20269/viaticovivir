export default function PantallaArchivo({ cajasArchivadas, onVolver, onReabrir, onEliminarCaja }) {
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
          <div key={c.id} className="caja-archivada">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p className="nombre">{c.descripcion || 'Viatico Vivir'}</p>
                <p className="detalle">
                  Inicio: {formatFecha(c.fecha_inicio)} ·
                  Monto: ${Number(c.monto_inicial).toLocaleString('es-AR')}
                </p>
                <p className="detalle">
                  Saldo final: <span style={{ color: c.saldo > 0 ? 'var(--verde)' : 'var(--rojo)' }}>
                    ${Number(c.saldo).toLocaleString('es-AR')}
                  </span>
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button
                onClick={() => onReabrir(c)}
                style={{ flex: 1, background: 'var(--amarillo)', color: '#1a1a1a', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700 }}
              >
                ↩ Reabrir
              </button>
              <button
                onClick={() => onEliminarCaja(c)}
                style={{ flex: 1, background: 'none', color: 'var(--rojo)', border: '1px solid var(--rojo)', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 600 }}
              >
                🗑 Eliminar
              </button>
            </div>
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
