export function PageTitle({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="mb-6! space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  )
}
