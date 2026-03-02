export default function NotFound() {
  return (
    <div className="space-y-3">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="text-slate-600">Page not found.</p>
      <Link className="underline" to="/">Go home</Link>
    </div>
  )
}
