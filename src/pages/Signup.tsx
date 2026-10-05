import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Sparkles, ArrowRight, Lock, Mail, User } from 'lucide-react'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.')
      return
    }
    setIsLoading(true)
    try {
      await signup(name, email, password)
      navigate('/app', { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao cadastrar. Tente novamente.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#1C1A17] p-4 text-[#F8F7F4] relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#C5A45F]/10 blur-3xl pointer-events-none" />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#C5A45F] to-[#E5C989] text-[#1C1A17] shadow-xl mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-serif">CELEBRA</h1>
          <p className="text-xs uppercase tracking-widest text-[#C5A45F] mt-1 font-semibold">
            Central Operacional do Evento
          </p>
        </div>

        <Card className="bg-[#26231F] border-[#3D3833] text-[#F8F7F4] shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold text-white">Criar Nova Conta</CardTitle>
            <CardDescription className="text-neutral-400">
              Cadastre-se para gerenciar seus eventos com precisão
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-2">
              {error && (
                <Alert className="bg-red-950/60 border-red-800 text-red-200 py-2">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-neutral-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#C5A45F]" /> Nome Completo
                </Label>
                <Input
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Hugo Cerimonial"
                  className="bg-[#1C1A17] border-[#443E38] text-white focus:border-[#C5A45F] h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-neutral-300 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#C5A45F]" /> E-mail Profissional
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cerimonial@evento.com"
                  className="bg-[#1C1A17] border-[#443E38] text-white focus:border-[#C5A45F] h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-neutral-300 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#C5A45F]" /> Senha (mínimo 8 dígitos)
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[#1C1A17] border-[#443E38] text-white focus:border-[#C5A45F] h-11"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#C5A45F] hover:bg-[#B08F4A] text-[#1C1A17] font-semibold h-12 text-base transition-all shadow-md"
              >
                {isLoading ? (
                  'Cadastrando...'
                ) : (
                  <span className="inline-flex items-center gap-2">
                    Criar Conta no Celebra <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
              <div className="text-center text-xs text-neutral-400 mt-2">
                Já tem conta?{' '}
                <Link to="/login" className="text-[#C5A45F] hover:underline font-semibold">
                  Fazer login
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
