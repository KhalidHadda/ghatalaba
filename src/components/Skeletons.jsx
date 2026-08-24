
export function Skeleton({ width = '100%', height = '20px', borderRadius = '8px', style = {} }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(0,200,150,0.08) 50%, rgba(255,255,255,0.03) 100%)',
        backgroundSize: '200% 100%',
        animation: 'skeletonShimmer 1.6s infinite ease-in-out',
        ...style,
      }}
    />
  )
}

export function ListingCardSkeleton() {
  return (
    <div style={{
      background: 'rgba(17, 28, 46, 0.75)',
      borderRadius: 16,
      border: '1px solid rgba(6, 182, 212, 0.15)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Skeleton height="180px" borderRadius="0px" />
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton width="40%" height="18px" />
          <Skeleton width="25%" height="22px" borderRadius="99px" />
        </div>
        <Skeleton width="70%" height="14px" />
        <Skeleton width="90%" height="12px" />
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <Skeleton width="50px" height="24px" borderRadius="6px" />
          <Skeleton width="50px" height="24px" borderRadius="6px" />
          <Skeleton width="50px" height="24px" borderRadius="6px" />
        </div>
      </div>
    </div>
  )
}

export function FeedPostSkeleton() {
  return (
    <div style={{
      background: 'rgba(17, 28, 46, 0.75)',
      borderRadius: 14,
      border: '1px solid rgba(6, 182, 212, 0.12)',
      padding: '16px',
      marginBottom: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Skeleton width="40px" height="40px" borderRadius="50%" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton width="35%" height="14px" />
          <Skeleton width="20%" height="11px" />
        </div>
      </div>
      <Skeleton width="100%" height="14px" />
      <Skeleton width="80%" height="14px" />
      <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
        <Skeleton width="60px" height="20px" borderRadius="6px" />
        <Skeleton width="60px" height="20px" borderRadius="6px" />
      </div>
    </div>
  )
}

export function PolycopeSkeleton() {
  return (
    <div style={{
      background: 'rgba(17, 28, 46, 0.75)',
      borderRadius: 14,
      border: '1px solid rgba(6, 182, 212, 0.15)',
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
        <Skeleton width="44px" height="44px" borderRadius="10px" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <Skeleton width="50%" height="16px" />
          <Skeleton width="30%" height="12px" />
        </div>
      </div>
      <Skeleton width="90px" height="32px" borderRadius="8px" />
    </div>
  )
}
