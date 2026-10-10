import { useState } from "react"
import { supabase } from "./src/lib/supabase"
export default function ResetPassword() {
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleReset = async () => {
    setLoading(true)
    setMessage("")

    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      setMessage("Erro ao atualizar senha")
    } else {
      setMessage("Senha atualizada com sucesso!")
    }

    setLoading(false)
  }

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1>Redefinir senha</h1>

      <input
        type="password"
        placeholder="Digite sua nova senha"
        onChange={(e) => setPassword(e.target.value)}
        style={{ padding: "10px", marginTop: "20px" }}
      />

      <br />

      <button
        onClick={handleReset}
        disabled={loading}
        style={{ marginTop: "20px", padding: "10px 20px" }}
      >
        {loading ? "Salvando..." : "Salvar nova senha"}
      </button>

      {message && <p style={{ marginTop: "20px" }}>{message}</p>}
    </div>
  )
}
