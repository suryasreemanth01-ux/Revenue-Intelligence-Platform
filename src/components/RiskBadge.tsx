type Props = { level: 'low' | 'medium' | 'high' };

const colors = { low: '#0a7', medium: '#d90', high: '#c33' };

export default function RiskBadge({ level }: Props) {
  return (
    <span style={{ background: colors[level], color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
      {level}
    </span>
  );
}