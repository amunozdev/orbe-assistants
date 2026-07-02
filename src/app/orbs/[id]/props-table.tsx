import { ORB_PROPS } from '@/registry/registry';

export const PropsTable = () => (
  <div className="overflow-x-auto rounded-2xl border border-border bg-panel/60">
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="border-b border-border">
          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted">Prop</th>
          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted">Type</th>
          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted">Default</th>
          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted">Description</th>
        </tr>
      </thead>
      <tbody>
        {ORB_PROPS.map((prop) => (
          <tr key={prop.name} className="border-b border-border align-top last:border-b-0">
            <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-medium text-accent-foreground">
              {prop.name}
            </td>
            <td className="min-w-40 px-4 py-3 font-mono text-xs text-muted">{prop.type}</td>
            <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">{prop.default}</td>
            <td className="min-w-56 px-4 py-3 text-xs leading-relaxed text-muted">{prop.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
