export default function SetingsSection({ title, description, children }) {
  return (
    <div style={{ width: '100%' }}>
      {(title || description) && (
        <div style={{ marginBottom: 20 }}>
          {title && (
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#1e293b',
                margin: '0 0 4px 0',
              }}
            >
              {title}
            </h3>
          )}
          {description && (
            <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
              {description}
            </p>
          )}
        </div>
      )}

      <div style={{ maxWidth: 640 }}>
        {children}
      </div>
    </div>
  );
}
