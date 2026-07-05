import { useState } from 'react'

const CLAVE = 'super'
const USUARIOS = ['Victor', 'Andrea']

export default function PantallaBienvenida({ onConfirmar }) {
  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState(false)

  function entrar() {
    if (clave.trim().toLowerCase() !== CLAVE) {
      setError(true)
      return
    }
    onConfirmar(usuario)
  }

  return (
    <div className="bienvenida">
      <div style={{ fontSize: 52 }}>💰</div>
      <h1>Viatico Vivir</h1>
      <p>Elegí tu nombre e ingresá la clave para entrar.</p>

      <div className="selector-usuario">
        {USUARIOS.map(u => (
          <button
            key={u}
            className={`btn-usuario ${usuario === u ? 'activo' : ''}`}
            onClick={() => setUsuario(u)}
          >
            {u}
          </button>
        ))}
      </div>

      <div className="campo" style={{ textAlign: 'left' }}>
        <label>Clave familiar</label>
        <input
          type="password"
          placeholder="Ingresá la clave"
          value={clave}
          onChange={e => { setClave(e.target.value); setError(false) }}
          onKeyDown={e => e.key === 'Enter' && usuario && entrar()}
        />
        {error && <p className="error-clave">Clave incorrecta. Probá de nuevo.</p>}
      </div>

      <button
        className="btn-principal"
        disabled={!usuario || !clave.trim()}
        onClick={entrar}
      >
        Entrar
      </button>
    </div>
  )
}
