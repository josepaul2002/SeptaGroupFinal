export default function BrandName({ name }) {
  if (name && name.toLowerCase() !== 'septa group') return <span>{name}</span>;
  return <span className="septa-wordmark"><strong>SEPTA</strong><em>GROUP</em></span>;
}
