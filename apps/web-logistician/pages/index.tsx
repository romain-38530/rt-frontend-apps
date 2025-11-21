export default function HomePage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      color: 'white',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊 Logistician Portal</h1>
      <p style={{ fontSize: '1.5rem', opacity: 0.9 }}>RT Technologie - Portail Logisticien</p>
      <p style={{ marginTop: '2rem', opacity: 0.7 }}>Gestion et optimisation logistique</p>
    </div>
  );
}
