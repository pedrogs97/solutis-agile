import type { CSSProperties } from 'react'

const spinnerStyle: CSSProperties = {
  width: '40px',
  height: '40px',
  border: '4px solid var(--mantine-color-default-border)',
  borderTop: '4px solid var(--mantine-color-blue-6)',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor:
    'light-dark(rgba(255, 255, 255, 0.8), rgba(26, 27, 30, 0.8))',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
}

function LoadingScreen() {
  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={overlayStyle}>
        <div style={spinnerStyle} />
      </div>
    </>
  )
}

export default LoadingScreen
